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

import { EMPTY, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { BookingsService } from '@app/services/bookings.service';
import { ToastService } from '@app/shared/services/toast.service';
import { BookingStatus } from '@app/shared/models';

import { AccommodationTableComponent } from './accommodation-table/accommodation-table';
import { BookingHeaderComponent } from './booking-header/booking-header';
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
    BookingHeaderComponent,
    CancellationDialogComponent,
    ClientSnapshotCardComponent,
    DocumentListComponent,
    InvoiceListMiniComponent,
    OperationsSectionComponent,
    TravelDetailsSectionComponent,
  ],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.scss',
})
export class BookingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly toast = inject(ToastService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly allData = rxResource<
    {
      booking: BookingResponseDto;
      invoices: InvoiceResponseDto[];
      documents: BookingDocumentResponseDto[];
    },
    string | null
  >({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params: id }) => {
      if (!id) {
        return EMPTY;
      }

      return forkJoin({
        booking: this.bookingsService.getById(id),
        invoices: this.bookingsService.listInvoices(id),
        documents: this.bookingsService.listDocuments(id),
      });
    },
  });

  readonly booking = computed(() => this.allData.value()?.booking ?? null);
  readonly invoices = computed(() => this.allData.value()?.invoices ?? []);
  readonly documents = computed(() => this.allData.value()?.documents ?? []);
  readonly loading = computed(() => this.allData.isLoading());
  readonly loadError = computed(() => this.allData.error());

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
    this.bookingsService.updateStatus(b.id, { status: BookingStatus.CONFIRMED }).subscribe({
      next: (updated) => this.patchBooking(updated),
      error: (err) => this.toast.showError(err.error?.message ?? 'Ошибка обновления статуса'),
      complete: () => this.actionLoading.set(false),
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
      .subscribe({
        next: (updated) => this.patchBooking(updated),
        error: (err) => this.toast.showError(err.error?.message ?? 'Ошибка отмены бронирования'),
        complete: () => this.actionLoading.set(false),
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
    this.bookingsService.update(b.id, dto).subscribe({
      next: (updated) => {
        this.patchBooking(updated);
        this.toast.showSuccess('Детали тура обновлены');
      },
      error: (err) => this.toast.showError(err.error?.message ?? 'Ошибка сохранения'),
      complete: () => this.savingTravel.set(false),
    });
  }

  onSaveOperations(dto: UpdateBookingDto): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.savingOps.set(true);
    this.bookingsService.update(b.id, dto).subscribe({
      next: (updated) => {
        this.patchBooking(updated);
        this.toast.showSuccess('Операционные данные обновлены');
      },
      error: (err) => this.toast.showError(err.error?.message ?? 'Ошибка сохранения'),
      complete: () => this.savingOps.set(false),
    });
  }

  onUploadFiles(files: File[]): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.uploading.set(true);

    const upload$ = forkJoin(files.map((f) => this.bookingsService.uploadDocument(b.id, f)));

    upload$.subscribe({
      next: (uploaded) => {
        const current = this.allData.value();

        if (current) {
          this.allData.set({ ...current, documents: [...current.documents, ...uploaded] });
        }
        this.toast.showSuccess(`Загружено файлов: ${uploaded.length}`);
      },
      error: (err) => this.toast.showError(err.error?.message ?? 'Ошибка загрузки файла'),
      complete: () => this.uploading.set(false),
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
        this.toast.showSuccess('Документ удалён');
      },
      error: (err) => this.toast.showError(err.error?.message ?? 'Ошибка удаления документа'),
    });
  }

  private patchBooking(updated: BookingResponseDto): void {
    const current = this.allData.value();

    if (current) {
      this.allData.set({ ...current, booking: updated });
    }
  }
}
