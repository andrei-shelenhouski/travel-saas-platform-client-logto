import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';

import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { AddTravelersDialogComponent } from '../booking-detail/add-travelers-dialog/add-travelers-dialog';
import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import {
  MAT_AUTOCOMPLETE,
  MAT_BUTTONS,
  MAT_DIALOG,
  MAT_FORM_BUTTONS,
} from '@app/shared/material-imports';
import { BOOKING_STATUS_OPTIONS, BookingStatus, PersonDocumentType } from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

import type {
  BookingStatus as BookingStatusType,
  ClientResponseDto,
  DirectBookingRequestDto,
  PersonDocumentResponseDto,
  PersonRelationshipResponseDto,
  PersonResponseDto,
} from '@app/shared/models';

type ExistingTraveler = {
  personId: string;
  documentId?: string;
  role: 'LEAD' | 'COMPANION';
};

type InlineTraveler = {
  localId: string;
  role: 'LEAD' | 'COMPANION';
  person: {
    firstName: string;
    lastName: string;
    patronymic?: string;
    dateOfBirth?: string;
    citizenship?: string;
    document?: {
      type?: 'INTL_PASSPORT' | 'NATIONAL_ID' | 'BIRTH_CERTIFICATE' | 'DRIVER_LICENSE' | 'OTHER';
      series?: string;
      number?: string;
      expiryDate?: string;
    };
  };
};

@Component({
  selector: 'app-create-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeading,
    ...MAT_FORM_BUTTONS,
    ...MAT_BUTTONS,
    ...MAT_AUTOCOMPLETE,
    ...MAT_DIALOG,
  ],
  templateUrl: './create-booking.html',
  styleUrl: './create-booking.scss',
})
export class CreateBookingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly bookingsService = inject(BookingsService);
  private readonly clientsService = inject(ClientsService);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loadingClients = signal(false);
  protected readonly loadingTravelerContext = signal(false);
  protected readonly saving = signal(false);

  protected readonly clientOptions = signal<ClientResponseDto[]>([]);
  protected readonly selectedClient = signal<ClientResponseDto | null>(null);
  protected readonly clientPerson = signal<PersonResponseDto | null>(null);
  protected readonly familyMembers = signal<PersonResponseDto[]>([]);
  protected readonly activeRelationshipPersonIds = signal<string[]>([]);

  protected readonly existingTravelers = signal<ExistingTraveler[]>([]);
  protected readonly inlineTravelers = signal<InlineTraveler[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    clientQuery: this.fb.nonNullable.control(''),
    clientId: this.fb.nonNullable.control('', Validators.required),
    destination: this.fb.nonNullable.control(''),
    departDate: this.fb.nonNullable.control('', Validators.required),
    returnDate: this.fb.nonNullable.control('', Validators.required),
    adults: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    children: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    totalPrice: this.fb.control<number | null>(null),
    status: this.fb.nonNullable.control<BookingStatusType>(BookingStatus.PENDING_CONFIRMATION),
    internalNotes: this.fb.nonNullable.control(''),
  });

  protected readonly inlineTravelerForm = this.fb.nonNullable.group({
    firstName: this.fb.nonNullable.control('', Validators.required),
    lastName: this.fb.nonNullable.control('', Validators.required),
    patronymic: this.fb.nonNullable.control(''),
    dateOfBirth: this.fb.nonNullable.control(''),
    citizenship: this.fb.nonNullable.control(''),
    role: this.fb.nonNullable.control<'LEAD' | 'COMPANION'>('COMPANION'),
    documentType: this.fb.control<keyof typeof PersonDocumentType | ''>('INTL_PASSPORT'),
    documentSeries: this.fb.nonNullable.control(''),
    documentNumber: this.fb.nonNullable.control(''),
    documentExpiryDate: this.fb.nonNullable.control(''),
  });

  protected readonly bookingStatusOptions = BOOKING_STATUS_OPTIONS;

  protected readonly travelerRoleOptions: { value: 'LEAD' | 'COMPANION'; label: string }[] = [
    { value: 'LEAD', label: 'LEAD' },
    { value: 'COMPANION', label: 'TRAVELER' },
  ];

  protected readonly documentTypeOptions: (keyof typeof PersonDocumentType)[] = Object.keys(
    PersonDocumentType,
  ) as (keyof typeof PersonDocumentType)[];

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    {
      initialValue: this.form.getRawValue(),
    },
  );

  protected readonly declaredTravelers = computed(() => {
    const value = this.formValue();

    return Number(value.adults ?? 0) + Number(value.children ?? 0);
  });

  protected readonly attachedTravelersCount = computed(() => {
    return this.existingTravelers().length + this.inlineTravelers().length;
  });

  protected readonly travelersCountWarning = computed(() => {
    const declared = this.declaredTravelers();
    const attached = this.attachedTravelersCount();

    if (attached === declared) {
      return null;
    }

    return `Декларировано туристов: ${declared}, прикреплено: ${attached}`;
  });

  protected readonly documentExpiryWarnings = computed(() => {
    const warnings: string[] = [];
    const returnDate = this.formValue().returnDate ?? '';
    const personsById = new Map(this.familyMembers().map((member) => [member.id, member] as const));

    for (const traveler of this.existingTravelers()) {
      const person = personsById.get(traveler.personId);

      if (!person) {
        continue;
      }

      const document = this.resolvePersonDocument(person, traveler.documentId);

      if (!document?.expiryDate) {
        continue;
      }

      if (!this.isDocumentExpiring(document.expiryDate, document.type, returnDate)) {
        continue;
      }

      warnings.push(
        `${this.personFullName(person)}: документ ${document.type} истекает` +
          ' менее чем через 6 месяцев после возвращения',
      );
    }

    for (const traveler of this.inlineTravelers()) {
      const document = traveler.person.document;

      if (!document?.expiryDate || !document.type) {
        continue;
      }

      if (!this.isDocumentExpiring(document.expiryDate, document.type, returnDate)) {
        continue;
      }

      warnings.push(
        `${traveler.person.lastName} ${traveler.person.firstName}: документ ${document.type} истекает` +
          ' менее чем через 6 месяцев после возвращения',
      );
    }

    return warnings;
  });

  constructor() {
    this.form.controls.clientQuery.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          const normalizedQuery = (typeof query === 'string' ? query : '').trim();

          if (normalizedQuery.length < 2) {
            this.loadingClients.set(false);
            this.clientOptions.set([]);

            return of<ClientResponseDto[]>([]);
          }

          this.loadingClients.set(true);

          return this.clientsService.getList({ search: normalizedQuery, page: 1, limit: 20 }).pipe(
            finalize(() => {
              this.loadingClients.set(false);
            }),
            switchMap((response) => of(response.items)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.clientOptions.set(items);
      });
  }

  protected displayClient = (client: ClientResponseDto | string | null): string => {
    if (!client) {
      return '';
    }

    if (typeof client === 'string') {
      return client;
    }

    return client.companyName ?? client.fullName ?? client.id;
  };

  protected onClientSelected(event: MatAutocompleteSelectedEvent): void {
    const client = event.option.value as ClientResponseDto;

    this.selectedClient.set(client);
    this.form.patchValue(
      {
        clientId: client.id,
        clientQuery: this.displayClient(client),
      },
      { emitEvent: false },
    );

    this.loadTravelerContext(client.id);
  }

  protected openTravelerPicker(): void {
    const clientPerson = this.clientPerson();

    if (!clientPerson) {
      this.snackBar.open('Сначала выберите клиента', 'Close', { duration: 5000 });

      return;
    }

    const dialogRef = this.dialog.open(AddTravelersDialogComponent, {
      width: '760px',
      data: {
        familyMembers: this.familyMembers(),
        returnDate: this.form.controls.returnDate.value || undefined,
        activeRelationshipPersonIds: this.activeRelationshipPersonIds(),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: { items?: { personId: string; documentId?: string }[] } | undefined) => {
        const items = result?.items ?? [];

        if (items.length === 0) {
          return;
        }

        const next = new Map<string, ExistingTraveler>();

        for (const traveler of this.existingTravelers()) {
          next.set(traveler.personId, traveler);
        }

        for (const item of items) {
          const role = item.personId === clientPerson.id ? 'LEAD' : 'COMPANION';
          next.set(item.personId, {
            personId: item.personId,
            documentId: item.documentId,
            role,
          });
        }

        this.existingTravelers.set(Array.from(next.values()));
      });
  }

  protected removeExistingTraveler(personId: string): void {
    const clientPersonId = this.clientPerson()?.id;

    if (clientPersonId === personId) {
      this.snackBar.open('Нельзя удалить клиента из списка туристов', 'Close', { duration: 5000 });

      return;
    }

    this.existingTravelers.update((current) =>
      current.filter((item) => item.personId !== personId),
    );
  }

  protected setExistingTravelerRole(personId: string, role: 'LEAD' | 'COMPANION'): void {
    this.existingTravelers.update((current) => {
      const next = current.map((item) => ({
        ...item,
        role: item.personId === personId ? role : item.role,
      }));

      if (role === 'LEAD') {
        return next.map((item) => ({
          ...item,
          role: item.personId === personId ? 'LEAD' : 'COMPANION',
        }));
      }

      if (next.some((item) => item.role === 'LEAD')) {
        return next;
      }

      return this.ensureLeadExists(next, this.inlineTravelers()).existingTravelers;
    });
  }

  protected addInlineTraveler(): void {
    if (this.inlineTravelerForm.invalid) {
      this.inlineTravelerForm.markAllAsTouched();

      return;
    }

    const raw = this.inlineTravelerForm.getRawValue();
    const role = raw.role as 'LEAD' | 'COMPANION';
    const documentType = raw.documentType || undefined;
    const documentNumber = raw.documentNumber.trim();
    const document =
      documentType && documentNumber
        ? {
            type: documentType,
            series: raw.documentSeries.trim() || undefined,
            number: documentNumber,
            expiryDate: raw.documentExpiryDate || undefined,
          }
        : undefined;

    const traveler: InlineTraveler = {
      localId: `${Date.now()}-${Math.random()}`,
      role,
      person: {
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        patronymic: raw.patronymic.trim() || undefined,
        dateOfBirth: raw.dateOfBirth || undefined,
        citizenship: raw.citizenship.trim() || undefined,
        document,
      },
    };

    if (role === 'LEAD') {
      this.existingTravelers.update((current) =>
        current.map((item) => ({ ...item, role: 'COMPANION' as const })),
      );
      this.inlineTravelers.update((current) => [
        ...current.map((item) => ({ ...item, role: 'COMPANION' as const })),
        traveler,
      ]);
    } else {
      this.inlineTravelers.update((current) => [...current, traveler]);
      this.existingTravelers.update((current) => {
        return this.ensureLeadExists(current, this.inlineTravelers()).existingTravelers;
      });
    }

    this.inlineTravelerForm.patchValue({
      firstName: '',
      lastName: '',
      patronymic: '',
      dateOfBirth: '',
      citizenship: '',
      role: 'COMPANION',
      documentType: 'INTL_PASSPORT',
      documentSeries: '',
      documentNumber: '',
      documentExpiryDate: '',
    });
  }

  protected removeInlineTraveler(localId: string): void {
    this.inlineTravelers.update((current) => current.filter((item) => item.localId !== localId));
    this.existingTravelers.update((current) => {
      return this.ensureLeadExists(current, this.inlineTravelers()).existingTravelers;
    });
  }

  protected setInlineTravelerRole(localId: string, role: 'LEAD' | 'COMPANION'): void {
    this.inlineTravelers.update((current) => {
      const next = current.map((item) => ({
        ...item,
        role: item.localId === localId ? role : item.role,
      }));

      if (role === 'LEAD') {
        this.existingTravelers.update((items) =>
          items.map((item) => ({ ...item, role: 'COMPANION' })),
        );

        return next.map((item) => ({
          ...item,
          role: item.localId === localId ? 'LEAD' : 'COMPANION',
        }));
      }

      if (next.some((item) => item.role === 'LEAD')) {
        return next;
      }

      const ensured = this.ensureLeadExists(this.existingTravelers(), next);

      this.existingTravelers.set(ensured.existingTravelers);

      return ensured.inlineTravelers;
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const attachedTravelers = this.attachedTravelersCount();

    if (attachedTravelers === 0) {
      this.snackBar.open('Добавьте хотя бы одного туриста', 'Close', { duration: 5000 });

      return;
    }

    const raw = this.form.getRawValue();
    const travelers: DirectBookingRequestDto['travelers'] = [
      ...this.existingTravelers().map((traveler) => ({
        personId: traveler.personId,
        documentId: traveler.documentId,
        role: traveler.role,
      })),
      ...this.inlineTravelers().map((traveler) => ({
        person: traveler.person,
        role: traveler.role,
      })),
    ];

    const totalPrice = raw.totalPrice ?? 0;
    const accommodationDetails = totalPrice > 0 ? [{ total: totalPrice }] : undefined;

    const dto: DirectBookingRequestDto = {
      clientId: raw.clientId,
      destination: raw.destination || undefined,
      departDate: raw.departDate || undefined,
      returnDate: raw.returnDate || undefined,
      adults: raw.adults,
      children: raw.children,
      status: raw.status,
      internalNotes: raw.internalNotes || undefined,
      accommodationDetails,
      travelers,
    };

    this.saving.set(true);
    this.bookingsService
      .createDirect(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (booking) => {
          this.snackBar.open('Бронирование создано', 'Close', { duration: 4000 });
          void this.router.navigate(['/app/bookings', booking.id]);
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message ?? 'Не удалось создать бронирование', 'Close', {
            duration: 5000,
          });
        },
      });
  }

  protected personNameById(personId: string): string {
    const person = this.familyMembers().find((item) => item.id === personId);

    if (!person) {
      return personId;
    }

    return this.personFullName(person);
  }

  protected existingTravelerDocumentLabel(traveler: ExistingTraveler): string {
    const person = this.familyMembers().find((item) => item.id === traveler.personId);

    if (!person) {
      return '—';
    }

    const document = this.resolvePersonDocument(person, traveler.documentId);

    if (!document) {
      return 'Документ не выбран';
    }

    return `${document.type} ${document.series ?? ''} ****${document.numberLast4}`.trim();
  }

  private loadTravelerContext(clientId: string): void {
    this.loadingTravelerContext.set(true);

    this.personsService
      .getByClientId(clientId)
      .pipe(
        switchMap((person) => {
          return forkJoin({
            person: of(person),
            family: this.personsService.getFamily(person.id),
            relationships: this.personsService.getRelationships(person.id),
          });
        }),
        finalize(() => {
          this.loadingTravelerContext.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ person, family, relationships }) => {
          const members = [person, ...family.filter((item) => item.id !== person.id)];
          const activeIds = this.buildActiveRelationshipIds(relationships, person.id);

          this.clientPerson.set(person);
          this.familyMembers.set(members);
          this.activeRelationshipPersonIds.set(activeIds);
          this.inlineTravelers.set([]);
          this.existingTravelers.set([
            {
              personId: person.id,
              documentId: this.primaryDocument(person)?.id,
              role: 'LEAD',
            },
          ]);
        },
        error: () => {
          this.snackBar.open('Не удалось загрузить туристов клиента', 'Close', { duration: 5000 });
        },
      });
  }

  private buildActiveRelationshipIds(
    relationships: PersonRelationshipResponseDto[],
    personId: string,
  ): string[] {
    const ids = new Set<string>([personId]);

    for (const relationship of relationships) {
      if (relationship.status === 'ACTIVE') {
        ids.add(relationship.relatedPersonId);
      }
    }

    return Array.from(ids);
  }

  private personFullName(person: PersonResponseDto): string {
    return [person.lastName, person.firstName, person.patronymic].filter(Boolean).join(' ');
  }

  private primaryDocument(person: PersonResponseDto): PersonDocumentResponseDto | undefined {
    const documents = this.personDocuments(person);

    return documents.find((document) => document.primary) ?? documents[0];
  }

  private resolvePersonDocument(
    person: PersonResponseDto,
    documentId?: string,
  ): PersonDocumentResponseDto | undefined {
    const documents = this.personDocuments(person);

    if (documentId) {
      return documents.find((document) => document.id === documentId);
    }

    return this.primaryDocument(person);
  }

  private personDocuments(person: PersonResponseDto): PersonDocumentResponseDto[] {
    return Array.isArray(person.documents) ? person.documents : [];
  }

  private isDocumentExpiring(expiryDate: string, type: string, returnDate: string): boolean {
    if (!returnDate) {
      return false;
    }

    if (type !== 'INTL_PASSPORT' && type !== 'NATIONAL_ID') {
      return false;
    }

    const returnAt = new Date(returnDate);
    const expiryAt = new Date(expiryDate);

    if (Number.isNaN(returnAt.getTime()) || Number.isNaN(expiryAt.getTime())) {
      return false;
    }

    const sixMonthsAfterReturn = new Date(returnAt);
    sixMonthsAfterReturn.setMonth(sixMonthsAfterReturn.getMonth() + 6);

    return expiryAt <= sixMonthsAfterReturn;
  }

  private ensureLeadExists(
    existing: ExistingTraveler[],
    inline: InlineTraveler[],
  ): { existingTravelers: ExistingTraveler[]; inlineTravelers: InlineTraveler[] } {
    if (
      existing.some((item) => item.role === 'LEAD') ||
      inline.some((item) => item.role === 'LEAD')
    ) {
      return { existingTravelers: existing, inlineTravelers: inline };
    }

    const clientPersonId = this.clientPerson()?.id;

    if (!clientPersonId) {
      return { existingTravelers: existing, inlineTravelers: inline };
    }

    return {
      existingTravelers: existing.map((item) => ({
        ...item,
        role: item.personId === clientPersonId ? 'LEAD' : item.role,
      })),
      inlineTravelers: inline,
    };
  }
}
