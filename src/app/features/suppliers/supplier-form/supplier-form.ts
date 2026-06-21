import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { PageContentComponent } from '@app/shared/components';
import { FormSectionComponent } from '@app/shared/components/form-section/form-section';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import {
  SUPPLIER_CATEGORY_LABELS,
  SUPPLIER_EXTERNAL_SYSTEMS,
  SUPPLIER_SERVICE_TYPE_LABELS,
  SupplierCategory,
  SupplierIntegrationType,
} from '@app/shared/models';

import type {
  CreateSupplierRequest,
  SupplierResponse,
  UpdateSupplierRequest,
} from '@app/shared/models';

const CATEGORIES_REQUIRING_EXTERNAL_SYSTEM: string[] = [
  SupplierCategory.OTA,
  SupplierCategory.BED_BANK,
  SupplierCategory.PACKAGE_OPERATOR,
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-supplier-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    PageContentComponent,
    FormSectionComponent,
    PageHeading,
    PageHeadingAction,
  ],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
})
export class SupplierFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialSupplier = input<SupplierResponse | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);
  readonly submitError = input('');

  readonly cancelled = output<void>();
  readonly createSubmitted = output<CreateSupplierRequest>();
  readonly updateSubmitted = output<UpdateSupplierRequest>();

  readonly isEditMode = computed(() => this.mode() === 'edit');

  readonly categoryOptions = Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  readonly serviceTypeOptions = Object.entries(SUPPLIER_SERVICE_TYPE_LABELS).map(
    ([value, label]) => ({ value, label }),
  );
  readonly integrationTypeOptions = [
    { value: SupplierIntegrationType.MANUAL, label: 'Вручную' },
    { value: SupplierIntegrationType.API, label: 'API' },
  ];
  readonly externalSystemOptions = SUPPLIER_EXTERNAL_SYSTEMS;

  readonly SupplierIntegrationType = SupplierIntegrationType;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    legalName: [''],
    supplierCategory: ['', Validators.required],
    serviceTypes: [[] as string[], Validators.required],
    integrationType: this.fb.nonNullable.control<string>(
      SupplierIntegrationType.MANUAL,
      Validators.required,
    ),
    externalSystem: [''],
    destinationNotes: [''],
    phone: [''],
    email: ['', Validators.email],
    website: [''],
    legalAddress: [''],
    unp: [''],
    iban: [''],
    bankName: [''],
    bik: [''],
    clientId: [''],
    notes: [''],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  readonly showExternalSystem = computed(() => {
    const val = this.formValue();
    const category = val.supplierCategory ?? '';
    const integration = val.integrationType ?? '';

    return (
      CATEGORIES_REQUIRING_EXTERNAL_SYSTEM.includes(category) ||
      integration === SupplierIntegrationType.API
    );
  });

  readonly selectedServiceTypes = signal<string[]>([]);

  constructor() {
    effect(() => {
      const mode = this.mode();

      if (mode === 'edit') {
        untracked(() => this.patchForm(this.initialSupplier()));
      }
    });

    effect(() => {
      if (this.isEditMode()) {
        this.patchForm(this.initialSupplier());
      }
    });
  }

  isServiceTypeSelected(value: string): boolean {
    return this.form.controls.serviceTypes.value.includes(value);
  }

  toggleServiceType(value: string): void {
    const current = [...this.form.controls.serviceTypes.value];
    const idx = current.indexOf(value);

    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }

    this.form.controls.serviceTypes.setValue(current);
    this.form.controls.serviceTypes.markAsTouched();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  submit(): void {
    if (this.form.invalid || this.loading() || this.saving()) {
      this.form.markAllAsTouched();

      return;
    }

    const raw = this.form.getRawValue();

    if (this.isEditMode()) {
      this.updateSubmitted.emit(this.buildUpdateDto(raw));

      return;
    }

    this.createSubmitted.emit(this.buildCreateDto(raw));
  }

  private patchForm(supplier: SupplierResponse | null): void {
    if (!supplier) {
      return;
    }

    this.form.patchValue({
      name: supplier.name,
      legalName: supplier.legalName ?? '',
      supplierCategory: supplier.supplierCategory,
      serviceTypes: supplier.serviceTypes ?? [],
      integrationType: String(supplier.integrationType),
      externalSystem: supplier.externalSystem ?? '',
      destinationNotes: supplier.destinationNotes ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      website: supplier.website ?? '',
      legalAddress: supplier.legalAddress ?? '',
      unp: supplier.unp ?? '',
      iban: supplier.iban ?? '',
      bankName: supplier.bankName ?? '',
      bik: supplier.bik ?? '',
      clientId: supplier.clientId ?? '',
      notes: supplier.notes ?? '',
    });
  }

  private buildCreateDto(
    raw: ReturnType<SupplierFormComponent['form']['getRawValue']>,
  ): CreateSupplierRequest {
    return {
      name: raw.name.trim(),
      legalName: raw.legalName.trim() || null,
      supplierCategory: raw.supplierCategory,
      serviceTypes: raw.serviceTypes,
      integrationType: raw.integrationType,
      externalSystem: raw.externalSystem.trim() || null,
      destinationNotes: raw.destinationNotes.trim() || null,
      phone: raw.phone.trim() || null,
      email: raw.email.trim() || null,
      website: raw.website.trim() || null,
      legalAddress: raw.legalAddress.trim() || null,
      unp: raw.unp.trim() || null,
      iban: raw.iban.trim() || null,
      bankName: raw.bankName.trim() || null,
      bik: raw.bik.trim() || null,
      clientId: raw.clientId.trim() || null,
      notes: raw.notes.trim() || null,
    };
  }

  private buildUpdateDto(
    raw: ReturnType<SupplierFormComponent['form']['getRawValue']>,
  ): UpdateSupplierRequest {
    return {
      name: raw.name.trim(),
      legalName: raw.legalName.trim() || null,
      supplierCategory: raw.supplierCategory,
      serviceTypes: raw.serviceTypes,
      integrationType: raw.integrationType,
      externalSystem: raw.externalSystem.trim() || null,
      destinationNotes: raw.destinationNotes.trim() || null,
      phone: raw.phone.trim() || null,
      email: raw.email.trim() || null,
      website: raw.website.trim() || null,
      legalAddress: raw.legalAddress.trim() || null,
      unp: raw.unp.trim() || null,
      iban: raw.iban.trim() || null,
      bankName: raw.bankName.trim() || null,
      bik: raw.bik.trim() || null,
      clientId: raw.clientId.trim() || null,
      notes: raw.notes.trim() || null,
    };
  }
}
