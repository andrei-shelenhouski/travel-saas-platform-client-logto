import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  {
    value: ClientType.INDIVIDUAL,
    label: 'Individual',
    subLabel: 'Private client',
    icon: 'person',
  },
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
    phone: ['', Validators.required],
    email: ['', Validators.email],
    telegramHandle: [''],
    legalAddress: [''],
    notes: [''],
    dataConsentGiven: [false],
    companyName: [''],
    unp: [''],
    commissionPct: [''],
  });

  selectType(type: ClientType): void {
    this.selectedType.set(type);
    this.updateValidators(type);
  }

  private updateValidators(type: ClientType): void {
    const { fullName, phone, companyName, unp, legalAddress } = this.form.controls;

    if (type === ClientType.INDIVIDUAL) {
      fullName.setValidators(Validators.required);
      phone.setValidators(Validators.required);
      companyName.clearValidators();
      unp.clearValidators();
      legalAddress.clearValidators();
    } else {
      fullName.setValidators(Validators.required);
      phone.setValidators(Validators.required);
      companyName.setValidators(Validators.required);
      unp.setValidators(Validators.required);
      legalAddress.setValidators(Validators.required);
    }

    fullName.updateValueAndValidity({ emitEvent: false });
    phone.updateValueAndValidity({ emitEvent: false });
    companyName.updateValueAndValidity({ emitEvent: false });
    unp.updateValueAndValidity({ emitEvent: false });
    legalAddress.updateValueAndValidity({ emitEvent: false });
  }

  createClient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const v = this.form.getRawValue();
    const type = this.selectedType();

    if (!type) {
      return;
    }

    const dto: CreateClientDto = {
      type,
      fullName: v.fullName.trim(),
      dataConsentGiven: v.dataConsentGiven,
    };

    if (type === ClientType.INDIVIDUAL) {
      if (v.phone.trim()) {
        dto.phone = v.phone.trim();
      }

      if (v.email.trim()) {
        dto.email = v.email.trim();
      }

      if (v.telegramHandle.trim()) {
        dto.telegramHandle = v.telegramHandle.trim();
      }

      if (v.legalAddress.trim()) {
        dto.legalAddress = v.legalAddress.trim();
      }

      if (v.notes.trim()) {
        dto.notes = v.notes.trim();
      }
    } else {
      dto.companyName = v.companyName.trim();
      dto.unp = v.unp.trim();
      dto.phone = v.phone.trim();
      dto.legalAddress = v.legalAddress.trim();

      if (v.email.trim()) {
        dto.email = v.email.trim();
      }

      if (type === ClientType.B2B_AGENT && v.commissionPct.trim()) {
        dto.commissionPct = parseFloat(v.commissionPct);
      }
    }

    this.dialogRef.close(dto);
  }
}
