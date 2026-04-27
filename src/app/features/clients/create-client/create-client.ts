import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ClientType, CreateClientDto } from '@app/shared/models';

type TypeOption = {
  value: ClientType;
  label: string;
  subLabel: string;
  icon: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  { value: ClientType.INDIVIDUAL, label: 'Individual', subLabel: 'Private client', icon: 'person' },
  { value: ClientType.COMPANY, label: 'Company', subLabel: 'Legal entity', icon: 'business' },
  {
    value: ClientType.B2B_AGENT,
    label: 'B2B agent',
    subLabel: 'Travel agency / partner',
    icon: 'work',
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-client',
  imports: [
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    ReactiveFormsModule,
    ...MAT_FORM_BUTTONS,
  ],
  templateUrl: './create-client.html',
  styleUrl: './create-client.scss',
})
export class CreateClientComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateClientComponent>);

  readonly ClientType = ClientType;
  readonly typeOptions = TYPE_OPTIONS;
  readonly selectedType = signal<ClientType | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
    telegramHandle: [''],
    notes: [''],
    dataConsentGiven: [false],
    dataConsentDate: [''],
    companyName: [''],
    legalAddress: [''],
    unp: ['', Validators.pattern(/^\d{9}$/)],
    okpo: [''],
    iban: [''],
    bankName: [''],
    bik: [''],
  });

  readonly commissionPctCtrl = this.fb.control<number | null>({ value: null, disabled: true });

  readonly consentGiven = toSignal(this.form.controls.dataConsentGiven.valueChanges, {
    initialValue: false,
  });

  private readonly _autoConsentDate = effect(() => {
    const checked = this.consentGiven();
    untracked(() => {
      if (checked && !this.form.controls.dataConsentDate.value) {
        this.form.controls.dataConsentDate.setValue(new Date().toISOString().slice(0, 10));
      }
    });
  });

  selectType(type: ClientType): void {
    this.selectedType.set(type);
    this.updateCompanyValidators(type);
  }

  private updateCompanyValidators(type: ClientType): void {
    const { companyName, legalAddress } = this.form.controls;
    const isCompanyType = type === ClientType.COMPANY || type === ClientType.B2B_AGENT;

    if (isCompanyType) {
      companyName.setValidators(Validators.required);
      legalAddress.setValidators(Validators.required);
    } else {
      companyName.clearValidators();
      legalAddress.clearValidators();
    }

    companyName.updateValueAndValidity({ emitEvent: false });
    legalAddress.updateValueAndValidity({ emitEvent: false });
  }

  createClient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const type = this.selectedType();

    if (!type) {
      return;
    }

    const v = this.form.getRawValue();
    const isCompanyType = type === ClientType.COMPANY || type === ClientType.B2B_AGENT;

    const dto: CreateClientDto = {
      type,
      fullName: v.fullName.trim(),
      dataConsentGiven: v.dataConsentGiven,
    };

    if (v.phone.trim()) {
      dto.phone = v.phone.trim();
    }

    if (v.email.trim()) {
      dto.email = v.email.trim();
    }

    if (v.telegramHandle.trim()) {
      dto.telegramHandle = v.telegramHandle.trim();
    }

    if (v.notes.trim()) {
      dto.notes = v.notes.trim();
    }

    if (isCompanyType) {
      dto.companyName = v.companyName.trim();
      dto.legalAddress = v.legalAddress.trim();

      if (v.unp.trim()) {
        dto.unp = v.unp.trim();
      }

      if (v.okpo.trim()) {
        dto.okpo = v.okpo.trim();
      }

      if (v.iban.trim()) {
        dto.iban = v.iban.trim();
      }

      if (v.bankName.trim()) {
        dto.bankName = v.bankName.trim();
      }

      if (v.bik.trim()) {
        dto.bik = v.bik.trim();
      }
    }

    this.dialogRef.close(dto);
  }
}
