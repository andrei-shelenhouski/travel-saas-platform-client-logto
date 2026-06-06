import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { catchError, of } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';
import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_MENU } from '@app/shared/material-imports';

import type {
  CreatePersonRequestDto,
  PersonAddressRequestDto,
  PersonAddressResponseDto,
  PersonContactRequestDto,
  PersonContactResponseDto,
  PersonDocumentRequestDto,
  PersonDocumentResponseDto,
  PersonResponseDto,
} from '@app/shared/models';
const DOC_TYPE_LABEL: Record<string, string> = {
  INTL_PASSPORT: 'Загранпаспорт',
  NATIONAL_PASSPORT: 'Паспорт',
  NATIONAL_ID: 'ID карта',
  BIRTH_CERTIFICATE: 'Свидетельство о рождении',
  DRIVER_LICENSE: 'Водительское удостоверение',
  OTHER: 'Другое',
};

const ADDR_TYPE_LABEL: Record<string, string> = {
  REGISTRATION: 'Прописка',
  RESIDENTIAL: 'Проживание',
  OTHER: 'Другое',
};

const CONTACT_MEDIUM_LABEL: Record<string, string> = {
  EMAIL: 'Email',
  PHONE: 'Телефон',
  TELEGRAM: 'Telegram',
};

const GENDER_LABEL: Record<string, string | undefined> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  OTHER: 'Другой',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-traveler-profile-section',
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
    ...MAT_MENU,
  ],
  templateUrl: './traveler-profile-section.html',
  styleUrl: './traveler-profile-section.scss',
})
export class TravelerProfileSectionComponent {
  readonly clientId = input.required<string>();
  readonly clientType = input.required<string>();
  readonly primaryContactChanged = output<void>();
  readonly personIdResolved = output<string>();

  protected readonly docTypeLabel = DOC_TYPE_LABEL;
  protected readonly addrTypeLabel = ADDR_TYPE_LABEL;
  protected readonly contactMediumLabel = CONTACT_MEDIUM_LABEL;
  protected readonly genderLabel = GENDER_LABEL;

  protected readonly docTypeOptions = Object.entries(DOC_TYPE_LABEL).map(([value, label]) => ({
    value,
    label,
  }));
  protected readonly addrTypeOptions = Object.entries(ADDR_TYPE_LABEL).map(([value, label]) => ({
    value,
    label,
  }));
  protected readonly contactMediumOptions = Object.entries(CONTACT_MEDIUM_LABEL).map(
    ([value, label]) => ({ value, label }),
  );
  protected readonly genderOptions = Object.entries(GENDER_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  private readonly personVersion = signal(0);

  private readonly personResource = rxResource<PersonResponseDto | null, [string, number]>({
    params: () => [this.clientId(), this.personVersion()] as [string, number],
    stream: ({ params }) => {
      const [clientId] = params;

      return this.personsService.getByClientId(clientId).pipe(
        catchError((err: { status?: number }) => {
          if (err?.status === 404) {
            return of(null);
          }

          this.snackBar.open('Не удалось загрузить профиль туриста', 'Close', { duration: 5000 });

          return of(null);
        }),
      );
    },
  });

  protected readonly person = computed(() => this.personResource.value() ?? null);
  protected readonly loading = computed(() => this.personResource.isLoading());
  protected readonly hasPerson = computed(() => this.person() !== null);

  constructor() {
    effect(() => {
      const id = this.person()?.id;

      if (id) {
        this.personIdResolved.emit(id);
      }
    });
  }

  // ---- Create person form ----
  protected readonly showCreateForm = signal(false);
  protected readonly createLoading = signal(false);
  protected readonly createForm = this.fb.nonNullable.group({
    firstName: [''],
    lastName: [''],
  });

  // ---- Core fields inline edit ----
  protected readonly editingCoreField = signal<'dateOfBirth' | 'citizenship' | 'gender' | null>(
    null,
  );
  protected readonly coreFieldSaving = signal(false);
  protected readonly coreFieldForm = this.fb.nonNullable.group({
    dateOfBirth: [''],
    citizenship: [''],
    gender: [''],
  });

  // ---- Documents ----
  protected readonly showAddDocForm = signal(false);
  protected readonly docFormSaving = signal(false);
  protected readonly editingDocId = signal<string | null>(null);
  protected readonly addDocForm = this.fb.nonNullable.group({
    type: ['INTL_PASSPORT'],
    number: [''],
    series: [''],
    issueDate: [''],
    expiryDate: [''],
    issuedBy: [''],
    primary: [false],
  });

  // ---- Addresses ----
  protected readonly showAddAddrForm = signal(false);
  protected readonly addrFormSaving = signal(false);
  protected readonly editingAddrId = signal<string | null>(null);
  protected readonly addAddrForm = this.fb.nonNullable.group({
    type: ['REGISTRATION'],
    street: [''],
    city: [''],
    region: [''],
    country: [''],
    postalCode: [''],
  });

  // ---- Contacts ----
  protected readonly showAddContactForm = signal(false);
  protected readonly contactFormSaving = signal(false);
  protected readonly editingContactId = signal<string | null>(null);
  protected readonly addContactForm = this.fb.nonNullable.group({
    medium: ['PHONE'],
    value: [''],
    primary: [false],
  });

  protected docExpiryClass(doc: PersonDocumentResponseDto): string {
    if (!doc.expiryDate) {
      return '';
    }

    const now = new Date();
    const expiry = new Date(doc.expiryDate);
    const sixMonths = new Date();

    sixMonths.setMonth(sixMonths.getMonth() + 6);

    if (expiry < now) {
      return 'expiry-expired';
    }

    if (expiry < sixMonths) {
      return 'expiry-soon';
    }

    return '';
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString('ru-RU', { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  protected addrLine(addr: PersonAddressResponseDto): string {
    return [addr.street, addr.city, addr.region, addr.country, addr.postalCode]
      .filter(Boolean)
      .join(', ');
  }

  protected groupedAddresses(
    addresses: PersonAddressResponseDto[],
  ): { type: string; label: string; items: PersonAddressResponseDto[] }[] {
    const map = new Map<string, PersonAddressResponseDto[]>();

    for (const addr of addresses) {
      const list = map.get(addr.type) ?? [];

      list.push(addr);
      map.set(addr.type, list);
    }

    return Array.from(map.entries()).map(([type, items]) => ({
      type,
      label: ADDR_TYPE_LABEL[type] ?? type,
      items,
    }));
  }

  protected startCreatePerson(): void {
    this.showCreateForm.set(true);
    this.createForm.reset({ firstName: '', lastName: '' });
  }

  protected cancelCreatePerson(): void {
    this.showCreateForm.set(false);
  }

  protected submitCreatePerson(): void {
    const { firstName, lastName } = this.createForm.getRawValue();

    if (!firstName.trim() || !lastName.trim()) {
      return;
    }

    const dto: CreatePersonRequestDto = { firstName: firstName.trim(), lastName: lastName.trim() };

    this.createLoading.set(true);
    this.personsService.createForClient(this.clientId(), dto).subscribe({
      next: () => {
        this.createLoading.set(false);
        this.showCreateForm.set(false);
        this.personVersion.update((v) => v + 1);
      },
      error: () => {
        this.createLoading.set(false);
        this.snackBar.open('Не удалось создать профиль туриста', 'Close', { duration: 5000 });
      },
    });
  }

  // ---- Core field edit ----

  protected startEditCoreField(field: 'dateOfBirth' | 'citizenship' | 'gender'): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.editingCoreField.set(field);
    this.coreFieldForm.patchValue({
      dateOfBirth: p.dateOfBirth ?? '',
      citizenship: p.citizenship ?? '',
      gender: p.gender ?? '',
    });
  }

  protected cancelEditCoreField(): void {
    this.editingCoreField.set(null);
  }

  protected saveCoreField(): void {
    const p = this.person();

    if (!p) {
      return;
    }

    const field = this.editingCoreField();

    if (!field) {
      return;
    }

    const raw = this.coreFieldForm.getRawValue();
    const dto = { [field]: raw[field] || undefined };

    this.coreFieldSaving.set(true);
    this.personsService.update(p.id, dto).subscribe({
      next: () => {
        this.coreFieldSaving.set(false);
        this.editingCoreField.set(null);
        this.personVersion.update((v) => v + 1);
      },
      error: () => {
        this.coreFieldSaving.set(false);
        this.snackBar.open('Не удалось сохранить', 'Close', { duration: 5000 });
      },
    });
  }

  // ---- Documents ----

  protected openAddDocForm(): void {
    this.editingDocId.set(null);
    this.addDocForm.reset({
      type: 'INTL_PASSPORT',
      number: '',
      series: '',
      issueDate: '',
      expiryDate: '',
      issuedBy: '',
      primary: false,
    });
    this.showAddDocForm.set(true);
  }

  protected openEditDocForm(doc: PersonDocumentResponseDto): void {
    this.editingDocId.set(doc.id);
    this.addDocForm.reset({
      type: doc.type,
      number: '',
      series: doc.series ?? '',
      issueDate: doc.issueDate ?? '',
      expiryDate: doc.expiryDate ?? '',
      issuedBy: doc.issuedBy ?? '',
      primary: doc.primary,
    });
    this.showAddDocForm.set(true);
  }

  protected cancelDocForm(): void {
    this.showAddDocForm.set(false);
    this.editingDocId.set(null);
  }

  protected submitDocForm(): void {
    const p = this.person();

    if (!p) {
      return;
    }

    const raw = this.addDocForm.getRawValue();

    if (!raw.number.trim()) {
      return;
    }

    const dto: PersonDocumentRequestDto = {
      type: raw.type,
      number: raw.number.trim(),
      series: raw.series || undefined,
      issueDate: raw.issueDate || undefined,
      expiryDate: raw.expiryDate || undefined,
      issuedBy: raw.issuedBy || undefined,
      primary: raw.primary,
    };

    this.docFormSaving.set(true);
    const editId = this.editingDocId();
    const obs = editId
      ? this.personsService.updateDocument(p.id, editId, dto)
      : this.personsService.addDocument(p.id, dto);

    obs.subscribe({
      next: () => {
        this.docFormSaving.set(false);
        this.showAddDocForm.set(false);
        this.editingDocId.set(null);
        this.personVersion.update((v) => v + 1);
      },
      error: () => {
        this.docFormSaving.set(false);
        this.snackBar.open('Не удалось сохранить документ', 'Close', { duration: 5000 });
      },
    });
  }

  protected deleteDoc(docId: string): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.personsService.deleteDocument(p.id, docId).subscribe({
      next: () => this.personVersion.update((v) => v + 1),
      error: () => this.snackBar.open('Не удалось удалить документ', 'Close', { duration: 5000 }),
    });
  }

  protected setDocPrimary(docId: string): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.personsService.setDocumentPrimary(p.id, docId).subscribe({
      next: () => this.personVersion.update((v) => v + 1),
      error: () =>
        this.snackBar.open('Не удалось установить основной документ', 'Close', { duration: 5000 }),
    });
  }

  // ---- Addresses ----

  protected openAddAddrForm(): void {
    this.editingAddrId.set(null);
    this.addAddrForm.reset({
      type: 'REGISTRATION',
      street: '',
      city: '',
      region: '',
      country: '',
      postalCode: '',
    });
    this.showAddAddrForm.set(true);
  }

  protected openEditAddrForm(addr: PersonAddressResponseDto): void {
    this.editingAddrId.set(addr.id);
    this.addAddrForm.reset({
      type: addr.type,
      street: addr.street ?? '',
      city: addr.city ?? '',
      region: addr.region ?? '',
      country: addr.country ?? '',
      postalCode: addr.postalCode ?? '',
    });
    this.showAddAddrForm.set(true);
  }

  protected cancelAddrForm(): void {
    this.showAddAddrForm.set(false);
    this.editingAddrId.set(null);
  }

  protected submitAddrForm(): void {
    const p = this.person();

    if (!p) {
      return;
    }

    const raw = this.addAddrForm.getRawValue();
    const dto: PersonAddressRequestDto = {
      type: raw.type,
      street: raw.street || undefined,
      city: raw.city || undefined,
      region: raw.region || undefined,
      country: raw.country || undefined,
      postalCode: raw.postalCode || undefined,
    };

    this.addrFormSaving.set(true);
    const editId = this.editingAddrId();
    const obs = editId
      ? this.personsService.updateAddress(p.id, editId, dto)
      : this.personsService.addAddress(p.id, dto);

    obs.subscribe({
      next: () => {
        this.addrFormSaving.set(false);
        this.showAddAddrForm.set(false);
        this.editingAddrId.set(null);
        this.personVersion.update((v) => v + 1);
      },
      error: () => {
        this.addrFormSaving.set(false);
        this.snackBar.open('Не удалось сохранить адрес', 'Close', { duration: 5000 });
      },
    });
  }

  protected deleteAddr(addrId: string): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.personsService.deleteAddress(p.id, addrId).subscribe({
      next: () => this.personVersion.update((v) => v + 1),
      error: () => this.snackBar.open('Не удалось удалить адрес', 'Close', { duration: 5000 }),
    });
  }

  // ---- Contacts ----

  protected openAddContactForm(): void {
    this.editingContactId.set(null);
    this.addContactForm.reset({ medium: 'PHONE', value: '', primary: false });
    this.showAddContactForm.set(true);
  }

  protected openEditContactForm(contact: PersonContactResponseDto): void {
    this.editingContactId.set(contact.id);
    this.addContactForm.reset({
      medium: contact.medium,
      value: contact.value,
      primary: contact.primary,
    });
    this.showAddContactForm.set(true);
  }

  protected cancelContactForm(): void {
    this.showAddContactForm.set(false);
    this.editingContactId.set(null);
  }

  protected submitContactForm(): void {
    const p = this.person();

    if (!p) {
      return;
    }

    const raw = this.addContactForm.getRawValue();

    if (!raw.value.trim()) {
      return;
    }

    const dto: PersonContactRequestDto = {
      medium: raw.medium,
      value: raw.value.trim(),
      primary: raw.primary,
    };

    this.contactFormSaving.set(true);
    const editId = this.editingContactId();
    const obs = editId
      ? this.personsService.updateContact(p.id, editId, dto)
      : this.personsService.addContact(p.id, dto);

    obs.subscribe({
      next: () => {
        this.contactFormSaving.set(false);
        this.showAddContactForm.set(false);
        this.editingContactId.set(null);
        this.personVersion.update((v) => v + 1);
      },
      error: () => {
        this.contactFormSaving.set(false);
        this.snackBar.open('Не удалось сохранить контакт', 'Close', { duration: 5000 });
      },
    });
  }

  protected deleteContact(ctcId: string): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.personsService.deleteContact(p.id, ctcId).subscribe({
      next: () => this.personVersion.update((v) => v + 1),
      error: () => this.snackBar.open('Не удалось удалить контакт', 'Close', { duration: 5000 }),
    });
  }

  protected setContactPrimary(ctcId: string): void {
    const p = this.person();

    if (!p) {
      return;
    }

    this.personsService.setContactPrimary(p.id, ctcId).subscribe({
      next: () => {
        this.personVersion.update((v) => v + 1);
        this.primaryContactChanged.emit();
      },
      error: () =>
        this.snackBar.open('Не удалось установить основной контакт', 'Close', { duration: 5000 }),
    });
  }
}
