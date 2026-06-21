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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { SupplierPickerComponent } from '@app/shared/components/supplier-picker/supplier-picker';
import { SignatureMethod } from '@app/shared/models';

import type {
  ContractResponseDto,
  CreateContractDto,
  SignatureMethod as SignatureMethodType,
  SupplierResponse,
  UpdateContractDto,
} from '@app/shared/models';

type SignatureMethodOption = {
  value: SignatureMethodType;
  label: string;
};

const SIGNATURE_METHOD_OPTIONS: SignatureMethodOption[] = [
  { value: SignatureMethod.ORIGINAL_MAIL, label: 'Почта' },
  {
    value: SignatureMethod.ORIGINAL_COURIER,
    label: 'Курьер',
  },
  {
    value: SignatureMethod.DIGITAL_PODPIS,
    label: 'Podpis.by',
  },
  { value: SignatureMethod.OTHER, label: 'Другое' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SupplierPickerComponent,
  ],
  templateUrl: './contract-form.html',
  styleUrl: './contract-form.scss',
})
export class ContractFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialContract = input<ContractResponseDto | null>(null);
  readonly clientId = input<string | null>(null);
  readonly allowClientIdEdit = input(false);
  readonly saving = input(false);
  readonly submitError = input('');

  readonly cancelled = output<void>();
  readonly createSubmitted = output<CreateContractDto>();
  readonly updateSubmitted = output<UpdateContractDto>();

  readonly isEditMode = computed(() => this.mode() === 'edit');
  readonly signatureMethodOptions = SIGNATURE_METHOD_OPTIONS;

  /** 'client' | 'supplier' — counterparty type for create mode */
  readonly counterpartyType = signal<'client' | 'supplier'>('client');
  readonly selectedSupplierId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    clientId: [''],
    contractNumber: ['', [Validators.required, Validators.maxLength(100)]],
    signedAt: ['', Validators.required],
    expiresAt: [''],
    signatureMethod: this.fb.control<SignatureMethodType | null>(null),
    notes: [''],
  });

  constructor() {
    effect(() => {
      const mode = this.mode();
      const contract = this.initialContract();
      const allowClientIdEdit = this.allowClientIdEdit();
      const clientId = this.clientId();

      if (mode === 'edit' && contract) {
        this.form.patchValue(
          {
            clientId: contract.clientId ?? '',
            contractNumber: contract.contractNumber,
            signedAt: contract.signedAt,
            expiresAt: contract.expiresAt ?? '',
            signatureMethod: contract.signatureMethod,
            notes: contract.notes ?? '',
          },
          { emitEvent: false },
        );
      }

      if (mode === 'create') {
        this.form.patchValue({ clientId: clientId ?? '' }, { emitEvent: false });
      }

      if (allowClientIdEdit && mode === 'create') {
        this.form.controls.clientId.setValidators([Validators.required]);
        this.form.controls.clientId.enable({ emitEvent: false });
      } else {
        this.form.controls.clientId.clearValidators();
        this.form.controls.clientId.disable({ emitEvent: false });
      }

      this.form.controls.clientId.updateValueAndValidity({ emitEvent: false });
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onSupplierSelected(supplier: SupplierResponse | null): void {
    this.selectedSupplierId.set(supplier?.id ?? null);
  }

  setCounterpartyType(type: 'client' | 'supplier'): void {
    this.counterpartyType.set(type);
    this.selectedSupplierId.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();

      return;
    }

    const rawValue = this.form.getRawValue();
    const basePayload: UpdateContractDto = {
      contractNumber: rawValue.contractNumber.trim(),
      signedAt: rawValue.signedAt,
      notes: rawValue.notes.trim() || undefined,
    };

    if (rawValue.expiresAt) {
      basePayload.expiresAt = rawValue.expiresAt;
    }

    if (rawValue.signatureMethod) {
      basePayload.signatureMethod = rawValue.signatureMethod;
    }

    if (this.isEditMode()) {
      this.updateSubmitted.emit(basePayload);

      return;
    }

    if (this.counterpartyType() === 'supplier') {
      const supplierId = this.selectedSupplierId();

      if (!supplierId) {
        return;
      }

      const createPayload: CreateContractDto = {
        supplierId,
        contractNumber: basePayload.contractNumber ?? '',
        signedAt: basePayload.signedAt ?? '',
        expiresAt: basePayload.expiresAt,
        signatureMethod: basePayload.signatureMethod,
        notes: basePayload.notes,
      };

      this.createSubmitted.emit(createPayload);

      return;
    }

    const selectedClientId = this.allowClientIdEdit()
      ? rawValue.clientId.trim()
      : (this.clientId() ?? '').trim();

    if (!selectedClientId) {
      this.form.controls.clientId.setErrors({ required: true });
      this.form.controls.clientId.markAsTouched();

      return;
    }

    const createPayload: CreateContractDto = {
      clientId: selectedClientId,
      contractNumber: basePayload.contractNumber ?? '',
      signedAt: basePayload.signedAt ?? '',
      expiresAt: basePayload.expiresAt,
      signatureMethod: basePayload.signatureMethod,
      notes: basePayload.notes,
    };

    this.createSubmitted.emit(createPayload);
  }
}
