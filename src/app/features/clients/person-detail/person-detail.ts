import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EMPTY, forkJoin } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import {
  DetailSectionComponent,
  LoadingStateComponent,
  PageContentComponent,
} from '@app/shared/components';
import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { ClientType, PersonGender } from '@app/shared/models';

import type {
  BookingResponseDto,
  PersonDocumentResponseDto,
  PersonRelationshipResponseDto,
  PersonResponseDto,
  UpdatePersonRequestDto,
} from '@app/shared/models';

const DOC_TYPE_LABEL: Record<string, string> = {
  INTL_PASSPORT: 'Загранпаспорт',
  NATIONAL_PASSPORT: 'Внутренний / общегражданский паспорт',
  NATIONAL_ID: 'Национальный ID / ID-карта',
  BIRTH_CERTIFICATE: 'Свидетельство о рождении',
  OTHER: 'Другой документ',
};

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  OTHER: 'Другой',
};

@Component({
  selector: 'app-person-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeading,
    PageHeadingAction,
    LoadingStateComponent,
    PageContentComponent,
    DetailSectionComponent,
    BookingStatusChipComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
  ],
  templateUrl: './person-detail.html',
  styleUrl: './person-detail.scss',
})
export class PersonDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly personsService = inject(PersonsService);
  private readonly clientsService = inject(ClientsService);
  private readonly bookingsService = inject(BookingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));

  private readonly personVersion = signal(0);

  private readonly personData = rxResource<
    {
      person: PersonResponseDto;
      relationships: PersonRelationshipResponseDto[];
      family: PersonResponseDto[];
      bookings: BookingResponseDto[];
    },
    readonly [string | null, number]
  >({
    params: () => [this.routeId() ?? null, this.personVersion()] as const,
    stream: ({ params }) => {
      const [id] = params;

      if (!id) {
        return EMPTY;
      }

      return forkJoin({
        person: this.personsService.getById(id),
        relationships: this.personsService.getRelationships(id),
        family: this.personsService.getFamily(id),
        bookings: this.bookingsService
          .getList({ page: 1, limit: 20, travelerPersonId: id })
          .pipe(map((response) => response.items)),
      });
    },
  });

  protected readonly person = computed(() => this.personData.value()?.person ?? null);
  protected readonly relationships = computed(() => this.personData.value()?.relationships ?? []);
  protected readonly relatedClientByPersonId = computed(() => {
    const clientsMap = new Map<string, string>();

    for (const person of this.personData.value()?.family ?? []) {
      if (person.clientId) {
        clientsMap.set(person.id, person.clientId);
      }
    }

    return clientsMap;
  });
  protected readonly bookings = computed(() => this.personData.value()?.bookings ?? []);
  protected readonly loading = computed(() => this.personData.isLoading());
  protected readonly promoting = signal(false);

  protected readonly age = computed(() => {
    const dob = this.person()?.dateOfBirth;

    if (!dob) {
      return null;
    }

    const birthDate = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  });

  protected readonly canPromote = computed(
    () => !this.person()?.clientId && this.person()?.dataConsentGiven === true,
  );

  protected readonly consentGiven = computed(() => this.person()?.dataConsentGiven === true);

  // ---- Edit panel ----
  protected readonly editPanelOpen = signal(false);
  protected readonly editSaving = signal(false);

  protected readonly editForm = this.fb.nonNullable.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    patronymic: [''],
    lastNameTranslit: ['', Validators.pattern(/^[A-Z]*$/)],
    firstNameTranslit: ['', Validators.pattern(/^[A-Z]*$/)],
    dateOfBirth: [''],
    gender: [''],
    citizenship: [''],
    personalNumber: ['', Validators.pattern(/^[A-Z0-9]*$/)],
    notes: [''],
  });

  protected readonly genderOptions = Object.entries(GENDER_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  protected readonly docTypeLabel = DOC_TYPE_LABEL;

  // ---- Consent gate ----
  protected readonly consentDialogOpen = signal(false);
  protected readonly consentSaving = signal(false);
  protected readonly consentForm = this.fb.nonNullable.group({
    consentDate: [new Date().toISOString().slice(0, 10)],
    confirmed: [false, Validators.requiredTrue],
  });

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleDateString('ru-RU');
  }

  protected openClient(clientId: string): void {
    void this.router.navigate(['/app/clients', clientId]);
  }

  protected relationshipStatusLabel(status: string): string {
    return status === 'INACTIVE' ? 'Неактивная' : 'Активная';
  }

  protected openBooking(bookingId: string): void {
    void this.router.navigate(['/app/bookings', bookingId]);
  }

  protected docLabel(doc: PersonDocumentResponseDto): string {
    const typeLabel = DOC_TYPE_LABEL[doc.type] ?? doc.type;
    const series = doc.series ? `${doc.series} ` : '';

    return `${typeLabel} · ${series}****${doc.numberLast4}`;
  }

  protected docExpiryClass(doc: PersonDocumentResponseDto): string {
    const expiryAppliesTo = new Set(['INTL_PASSPORT', 'NATIONAL_PASSPORT', 'NATIONAL_ID']);

    if (!doc.expiryDate || !expiryAppliesTo.has(doc.type)) {
      return '';
    }

    const now = new Date();
    const expiry = new Date(doc.expiryDate);
    const sixMonths = new Date();

    sixMonths.setMonth(sixMonths.getMonth() + 6);

    if (expiry < now) {
      return 'doc-expired';
    }

    if (expiry < sixMonths) {
      return 'doc-expiring';
    }

    return '';
  }

  protected genderLabel(g: string | null | undefined): string {
    if (!g) {
      return '—';
    }

    return GENDER_LABEL[g] ?? g;
  }

  // ---- Edit panel actions ----
  protected openEditPanel(): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.editForm.reset({
      lastName: p.lastName,
      firstName: p.firstName,
      patronymic: p.patronymic ?? '',
      lastNameTranslit: p.lastNameTranslit ?? '',
      firstNameTranslit: p.firstNameTranslit ?? '',
      dateOfBirth: p.dateOfBirth ?? '',
      gender: p.gender ?? '',
      citizenship: p.citizenship ?? '',
      personalNumber: p.personalNumber ?? '',
      notes: p.notes ?? '',
    });
    this.editPanelOpen.set(true);
  }

  protected closeEditPanel(): void {
    this.editPanelOpen.set(false);
  }

  protected uppercaseOnBlur(controlName: keyof typeof this.editForm.controls): void {
    const ctrl = this.editForm.controls[controlName];

    ctrl.setValue((ctrl.value as string).toUpperCase().trim());
  }

  protected saveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();

      return;
    }

    const person = this.person();

    if (!person) {
      return;
    }

    const raw = this.editForm.getRawValue();
    const dto: UpdatePersonRequestDto = {
      lastName: raw.lastName.trim(),
      firstName: raw.firstName.trim(),
      patronymic: raw.patronymic.trim() || undefined,
      lastNameTranslit: raw.lastNameTranslit.trim() || undefined,
      firstNameTranslit: raw.firstNameTranslit.trim() || undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      gender: (raw.gender || undefined) as PersonGender | undefined,
      citizenship: raw.citizenship.trim() || undefined,
      personalNumber: raw.personalNumber.trim() || undefined,
      notes: raw.notes.trim() || undefined,
    };

    this.editSaving.set(true);
    this.personsService
      .update(person.id, dto)
      .pipe(finalize(() => this.editSaving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Данные сохранены', 'Close', { duration: 3000 });
          this.editPanelOpen.set(false);
          this.personVersion.update((v) => v + 1);
        },
        error: (err) =>
          this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить', 'Close', {
            duration: 5000,
          }),
      });
  }

  // ---- Consent gate ----
  protected openConsentDialog(): void {
    this.consentForm.reset({
      consentDate: new Date().toISOString().slice(0, 10),
      confirmed: false,
    });
    this.consentDialogOpen.set(true);
  }

  protected closeConsentDialog(): void {
    this.consentDialogOpen.set(false);
  }

  protected saveConsent(): void {
    if (this.consentForm.invalid) {
      this.consentForm.markAllAsTouched();

      return;
    }

    const person = this.person();

    if (!person) {
      return;
    }

    const { consentDate } = this.consentForm.getRawValue();

    this.consentSaving.set(true);
    this.personsService
      .update(person.id, { dataConsentGiven: true, dataConsentDate: consentDate })
      .pipe(finalize(() => this.consentSaving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Согласие зафиксировано', 'Close', { duration: 3000 });
          this.consentDialogOpen.set(false);
          this.personVersion.update((v) => v + 1);
        },
        error: (err) =>
          this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить согласие', 'Close', {
            duration: 5000,
          }),
      });
  }

  // ---- Promote to client ----
  protected promoteToClient(): void {
    const person = this.person();

    if (!person || this.promoting()) {
      return;
    }

    const primaryPhone = person.contacts.find(
      (item) => item.medium === 'PHONE' && item.primary,
    )?.value;
    const primaryEmail = person.contacts.find(
      (item) => item.medium === 'EMAIL' && item.primary,
    )?.value;
    const fullNameParts = [person.lastName, person.firstName, person.patronymic].filter(Boolean);

    this.promoting.set(true);
    this.clientsService
      .create({
        type: ClientType.INDIVIDUAL,
        fullName: fullNameParts.join(' '),
        phone: primaryPhone,
        email: primaryEmail,
        dataConsentGiven: Boolean(person.dataConsentGiven),
      })
      .pipe(
        switchMap((client) =>
          this.personsService
            .linkToClient(client.id, { personId: person.id })
            .pipe(map(() => client)),
        ),
        finalize(() => this.promoting.set(false)),
      )
      .subscribe({
        next: (client) => {
          this.snackBar.open('Профиль клиента создан', 'Close', { duration: 4000 });
          void this.router.navigate(['/app/clients', client.id]);
        },
        error: () =>
          this.snackBar.open('Не удалось создать профиль клиента', 'Close', { duration: 5000 }),
      });
  }
}
