import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

import { EMPTY, forkJoin, of } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

import { BookingsService } from '@app/services/bookings.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { PermissionService } from '@app/services/permission.service';
import { PersonsService } from '@app/services/persons.service';
import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { CustomFieldsSectionComponent } from '@app/shared/components/custom-fields-section/custom-fields-section';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { AccommodationTableComponent } from './accommodation-table/accommodation-table';
import { AddTravelersDialogComponent } from './add-travelers-dialog/add-travelers-dialog';
import { AdditionalServicesTableComponent } from './additional-services-table/additional-services-table';
import { BookingTravelersSectionComponent } from './booking-travelers-section/booking-travelers-section';
import { CancellationDialogComponent } from './cancellation-dialog/cancellation-dialog';
import { ClientSnapshotCardComponent } from './client-snapshot-card/client-snapshot-card';
import { DocumentListComponent } from './document-list/document-list';
import { InvoiceListMiniComponent } from './invoice-list-mini/invoice-list-mini';
import { OperationsSectionComponent } from './operations-section/operations-section';
import { TravelDetailsSectionComponent } from './travel-details-section/travel-details-section';

import type {
  BookingDocumentResponseDto,
  BookingResponseDto,
  BookingTravelerResponseDto,
  CustomFieldValueDto,
  InvoiceResponseDto,
  PersonResponseDto,
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
    BookingTravelersSectionComponent,
    CustomFieldsSectionComponent,
    ...MAT_BUTTONS,
  ],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.scss',
})
export class BookingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingsService = inject(BookingsService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly permissions = inject(PermissionService);
  private readonly personsService = inject(PersonsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly BookingStatus = BookingStatus;

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly allData = rxResource<
    {
      booking: BookingResponseDto;
      invoices: InvoiceResponseDto[];
      documents: BookingDocumentResponseDto[];
      travelers: BookingTravelerResponseDto[];
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
        travelers: this.bookingsService.listTravelers(id),
      });
    },
  });

  readonly booking = computed(() => this.allData.value()?.booking ?? null);
  readonly invoices = computed(() => this.allData.value()?.invoices ?? []);
  readonly documents = computed(() => this.allData.value()?.documents ?? []);
  readonly travelers = computed(() => this.allData.value()?.travelers ?? []);
  readonly canViewInvoices = computed(() => this.permissions.canViewInvoices());
  readonly canManageTravelers = computed(() => this.permissions.canUpdateBookings());
  readonly showLegacyTravelers = computed(
    () => this.travelers().length === 0 && Boolean(this.booking()?.travelers),
  );
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
        return 'Бронирование не найдено';
      }

      return error.error?.message ?? error.message ?? 'Не удалось загрузить бронирование';
    }

    return 'Не удалось загрузить бронирование';
  });

  readonly actionLoading = signal(false);
  readonly customFieldsSaving = signal(false);
  readonly savingTravel = signal(false);
  readonly savingOps = signal(false);
  readonly uploading = signal(false);

  readonly cancellationDialogOpen = signal(false);

  readonly customFieldsSection = viewChild(CustomFieldsSectionComponent);

  private readonly customFieldsData = rxResource<CustomFieldValueDto[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.customFieldsService.getBookingValues(id);
    },
  });

  readonly customFields = computed(() => {
    return (this.customFieldsData.value() ?? []).map((field, index) => ({
      definitionId: field.definitionId,
      name: field.name,
      fieldType: field.fieldType,
      options: field.options ?? [],
      value: field.value ?? '',
      required: field.required ?? false,
      sortOrder: field.sortOrder ?? index + 1,
    }));
  });

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

    if (this.customFields().length > 0) {
      const section = this.customFieldsSection();

      if (section && !section.ensureRequiredFieldsFilledForStatusChange()) {
        return;
      }
    }

    this.actionLoading.set(true);
    this.bookingsService
      .updateStatus(b.id, { status: BookingStatus.CONFIRMED })
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (updated) => this.patchBooking(updated),
        error: (err) =>
          this.toast.showError(err.error?.message ?? 'Не удалось обновить статус бронирования'),
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

    if (this.customFields().length > 0) {
      const section = this.customFieldsSection();

      if (section && !section.ensureRequiredFieldsFilledForStatusChange()) {
        return;
      }
    }

    this.cancellationDialogOpen.set(false);
    this.actionLoading.set(true);
    this.bookingsService
      .updateStatus(b.id, { status: BookingStatus.CANCELLED, reason: result.reason })
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (updated) => this.patchBooking(updated),
        error: (err) =>
          this.toast.showError(err.error?.message ?? 'Не удалось отменить бронирование'),
      });
  }

  onSaveCustomFields(values: Record<string, string>): void {
    const b = this.booking();

    if (!b) {
      return;
    }

    this.customFieldsSaving.set(true);
    this.customFieldsService
      .upsertBookingValues(b.id, { values })
      .pipe(finalize(() => this.customFieldsSaving.set(false)))
      .subscribe({
        next: (updatedValues) => {
          this.customFieldsData.set(updatedValues);
          this.toast.showSuccess('Дополнительные поля сохранены');
        },
        error: (err) =>
          this.toast.showError(err.error?.message ?? 'Не удалось сохранить дополнительные поля'),
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
          this.toast.showSuccess('Детали тура обновлены');
        },
        error: (err) =>
          this.toast.showError(err.error?.message ?? 'Не удалось сохранить изменения'),
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
          this.toast.showSuccess('Операционные данные обновлены');
        },
        error: (err) =>
          this.toast.showError(err.error?.message ?? 'Не удалось сохранить изменения'),
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
        this.toast.showSuccess(`Загружено файлов: ${uploaded.length}`);
      },
      error: (err) => this.toast.showError(err.error?.message ?? 'Не удалось загрузить файл'),
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
        this.toast.showSuccess('Документ удален');
      },
      error: (err) => this.toast.showError(err.error?.message ?? 'Не удалось удалить документ'),
    });
  }

  onOpenAddTravelers(): void {
    const booking = this.booking();

    if (!booking) {
      return;
    }

    this.personsService
      .getByClientId(booking.clientId)
      .pipe(
        switchMap((person) =>
          forkJoin({
            family: this.personsService.getFamily(person.id),
            relationships: this.personsService.getRelationships(person.id),
          }).pipe(
            map(({ family, relationships }) => ({
              members: [person, ...family],
              activeRelationshipPersonIds: [
                person.id,
                ...relationships.filter((r) => r.status === 'ACTIVE').map((r) => r.relatedPersonId),
              ],
            })),
          ),
        ),
      )
      .subscribe({
        next: ({ members, activeRelationshipPersonIds }) =>
          this.openAddTravelersDialog(members, activeRelationshipPersonIds),
        error: () => this.toast.showError('Не удалось загрузить список семьи'),
      });
  }

  onRemoveTraveler(traveler: BookingTravelerResponseDto): void {
    const booking = this.booking();

    if (!booking) {
      return;
    }

    this.bookingsService.removeTraveler(booking.id, traveler.id).subscribe({
      next: () => {
        const current = this.allData.value();

        if (!current) {
          return;
        }

        this.allData.set({
          ...current,
          travelers: current.travelers.filter((item) => item.id !== traveler.id),
        });
      },
      error: () => this.toast.showError('Не удалось удалить туриста'),
    });
  }

  private openAddTravelersDialog(
    familyMembers: PersonResponseDto[],
    activeRelationshipPersonIds: string[],
  ): void {
    const booking = this.booking();

    if (!booking) {
      return;
    }

    const dialogRef = this.dialog.open<
      AddTravelersDialogComponent,
      {
        familyMembers: PersonResponseDto[];
        returnDate?: string;
        activeRelationshipPersonIds: string[];
      },
      { items: { personId: string; documentId?: string }[] }
    >(AddTravelersDialogComponent, {
      width: '760px',
      data: {
        familyMembers,
        returnDate: booking.returnDate,
        activeRelationshipPersonIds,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result: { items?: { personId: string; documentId?: string }[] } | undefined) => {
          const raw = result?.items ?? [];

          if (raw.length === 0) {
            return of<BookingTravelerResponseDto[]>([]);
          }

          const existingTravelers = this.allData.value()?.travelers ?? [];
          const hasExistingLead = existingTravelers.some((t) => t.role === 'LEAD');

          let leadIdx = -1;

          if (!hasExistingLead) {
            const clientPersonId = booking.clientPersonId;
            const leadIndex = clientPersonId
              ? raw.findIndex((item) => item.personId === clientPersonId)
              : -1;
            leadIdx = leadIndex >= 0 ? leadIndex : 0;
          }

          const travelers = raw.map((item, i) => ({
            ...item,
            role: i === leadIdx ? ('LEAD' as const) : ('COMPANION' as const),
          }));

          return this.bookingsService.addTravelers(booking.id, { travelers });
        }),
      )
      .subscribe({
        next: (addedTravelers) => {
          if (addedTravelers.length === 0) {
            return;
          }

          const current = this.allData.value();

          if (!current) {
            return;
          }

          this.allData.set({
            ...current,
            travelers: [...current.travelers, ...addedTravelers],
          });
        },
        error: () => this.toast.showError('Не удалось добавить туристов'),
      });
  }

  private patchBooking(updated: BookingResponseDto): void {
    const current = this.allData.value();

    if (current) {
      this.allData.set({ ...current, booking: updated });
    }
  }
}
