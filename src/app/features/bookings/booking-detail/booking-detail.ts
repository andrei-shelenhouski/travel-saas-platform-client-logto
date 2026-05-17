import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { EMPTY, forkJoin, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { BookingsService } from '@app/services/bookings.service';
import { PermissionService } from '@app/services/permission.service';
import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { AccommodationTableComponent } from './accommodation-table/accommodation-table';
import { AdditionalServicesTableComponent } from './additional-services-table/additional-services-table';
import { CancellationDialogComponent } from './cancellation-dialog/cancellation-dialog';
import { ClientSnapshotCardComponent } from './client-snapshot-card/client-snapshot-card';
import { DocumentListComponent } from './document-list/document-list';
import { InvoiceListMiniComponent } from './invoice-list-mini/invoice-list-mini';
import { OperationsSectionComponent } from './operations-section/operations-section';
import { TravelDetailsSectionComponent } from './travel-details-section/travel-details-section';

import type {
  BookingDocumentResponseDto,
  BookingResponseDto,
  InvoiceResponseDto,
  UpdateBookingDto,
} from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-booking-detail',
  imports: [
    AccommodationTableComponent,
    AdditionalServicesTableComponent,
    BookingStatusChipComponent,
    CancellationDialogComponent,
    ClientSnapshotCardComponent,
    DocumentListComponent,
    InvoiceListMiniComponent,
    OperationsSectionComponent,
    PageHeading,
    TravelDetailsSectionComponent,
    ...MAT_BUTTONS,
  ],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.scss',
})
export class BookingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly permissions = inject(PermissionService);
  private readonly toast = inject(ToastService);

  readonly BookingStatus = BookingStatus;

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly allData = rxResource<
    {
      booking: BookingResponseDto;
      invoices: InvoiceResponseDto[];
      documents: BookingDocumentResponseDto[];
    },
    {
      id: string | null;
      canViewInvoices: boolean;
    }
  >({
    params: () => ({
      id: this.routeId() ?? null,
      canViewInvoices: this.permissions.canViewInvoices(),
    }),
    stream: ({ params }) => {
      const { canViewInvoices, id } = params;

      if (!id) {
        return EMPTY;
      }

      const invoices$ = canViewInvoices
        ? this.bookingsService.listInvoices(id).pipe(map((response) => response.items))
        : of([]);

      return forkJoin({
        booking: this.bookingsService.getById(id),
        invoices: invoices$,
        documents: this.bookingsService.listDocuments(id),
      });
    },
  });

  readonly booking = computed(() => this.allData.value()?.booking ?? null);
  readonly invoices = computed(() => this.allData.value()?.invoices ?? []);
  readonly documents = computed(() => this.allData.value()?.documents ?? []);
  readonly canViewInvoices = computed(() => this.permissions.canViewInvoices());
  readonly loading = computed(() => this.allData.isLoading());
  readonly loadError = computed(() => this.allData.error());
  readonly loadNotFound = computed(() => {
    const error = this.loadError();

    return error instanceof HttpErrorResponse && error.status === 404;
  });
  readonly loadErrorMessage = computed(() => {
    const error = this.loadError();

    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        return $localize`:@@bookingNotFoundTitle:Booking not found`;
      }

      return (
        error.error?.message ??
        error.message ??
        $localize`:@@bookingLoadFailed:Failed to load booking`
      );
    }

    return $localize`:@@bookingLoadFailed:Failed to load booking`;
  });

  readonly actionLoading = signal(false);
  readonly savingTravel = signal(false);
  readonly savingOps = signal(false);
  readonly uploading = signal(false);

  readonly cancellationDialogOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        void this.router.navigate(['/app/bookings']);
      }
    });
  }

  onConfirmBooking(): void {
    const b = this.booking();

    if (!b || this.actionLoading()) {
      return;
    }

    this.actionLoading.set(true);
    this.bookingsService
      .updateStatus(b.id, { status: BookingStatus.CONFIRMED })
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (updated) => this.patchBooking(updated),
        error: (err) =>
          this.toast.showError(
            err.error?.message ??
              $localize`:@@bookingStatusUpdateFailed:Failed to update booking status`,
          ),
      });
  }

  onCancelBooking(): void {
    this.cancellationDialogOpen.set(true);
  }

  onCancellationConfirmed(result: { reason: string }): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.cancellationDialogOpen.set(false);
    this.actionLoading.set(true);
    this.bookingsService
      .updateStatus(b.id, { status: BookingStatus.CANCELLED, reason: result.reason })
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (updated) => this.patchBooking(updated),
        error: (err) =>
          this.toast.showError(
            err.error?.message ?? $localize`:@@bookingCancellationFailed:Failed to cancel booking`,
          ),
      });
  }

  onCancellationCancelled(): void {
    this.cancellationDialogOpen.set(false);
  }

  onSaveTravelDetails(dto: UpdateBookingDto): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.savingTravel.set(true);
    this.bookingsService
      .update(b.id, dto)
      .pipe(finalize(() => this.savingTravel.set(false)))
      .subscribe({
        next: (updated) => {
          this.patchBooking(updated);
          this.toast.showSuccess($localize`:@@bookingTravelDetailsUpdated:Travel details updated`);
        },
        error: (err) =>
          this.toast.showError(
            err.error?.message ?? $localize`:@@bookingSaveFailed:Failed to save changes`,
          ),
      });
  }

  onSaveOperations(dto: UpdateBookingDto): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.savingOps.set(true);
    this.bookingsService
      .update(b.id, dto)
      .pipe(finalize(() => this.savingOps.set(false)))
      .subscribe({
        next: (updated) => {
          this.patchBooking(updated);
          this.toast.showSuccess($localize`:@@bookingOperationsUpdated:Operations data updated`);
        },
        error: (err) =>
          this.toast.showError(
            err.error?.message ?? $localize`:@@bookingSaveFailed:Failed to save changes`,
          ),
      });
  }

  onUploadFiles(files: File[]): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.uploading.set(true);

    const upload$ = forkJoin(files.map((f) => this.bookingsService.uploadDocument(b.id, f)));

    upload$.pipe(finalize(() => this.uploading.set(false))).subscribe({
      next: (uploaded) => {
        const current = this.allData.value();

        if (current) {
          this.allData.set({ ...current, documents: [...current.documents, ...uploaded] });
        }
        this.toast.showSuccess(
          $localize`:@@bookingFilesUploaded:Uploaded files: ${uploaded.length}:uploadedCount:`,
        );
      },
      error: (err) =>
        this.toast.showError(
          err.error?.message ?? $localize`:@@bookingFileUploadFailed:Failed to upload file`,
        ),
    });
  }

  onDeleteDocument(doc: BookingDocumentResponseDto): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.bookingsService.deleteDocument(b.id, doc.id).subscribe({
      next: () => {
        const current = this.allData.value();

        if (current) {
          this.allData.set({
            ...current,
            documents: current.documents.filter((d) => d.id !== doc.id),
          });
        }
        this.toast.showSuccess($localize`:@@bookingDocumentDeleted:Document deleted`);
      },
      error: (err) =>
        this.toast.showError(
          err.error?.message ?? $localize`:@@bookingDocumentDeleteFailed:Failed to delete document`,
        ),
    });
  }

  private patchBooking(updated: BookingResponseDto): void {
    const current = this.allData.value();

    if (current) {
      this.allData.set({ ...current, booking: updated });
    }
  }
}
