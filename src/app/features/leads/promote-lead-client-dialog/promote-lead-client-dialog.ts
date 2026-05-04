import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { LeadsService } from '@app/services/leads.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ClientType, LeadResponseDto, PromoteLeadToClientDto } from '@app/shared/models';

type PromoteLeadClientDialogData = {
  lead: LeadResponseDto;
};

type FormControlKey =
  | 'type'
  | 'fullName'
  | 'phone'
  | 'email'
  | 'telegramHandle'
  | 'notes'
  | 'companyName'
  | 'legalAddress'
  | 'unp'
  | 'okpo'
  | 'iban'
  | 'bankName'
  | 'bik'
  | 'dataConsentGiven'
  | 'dataConsentDate';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-promote-lead-client-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatCheckboxModule, ...MAT_FORM_BUTTONS],
  templateUrl: './promote-lead-client-dialog.html',
  styleUrl: './promote-lead-client-dialog.scss',
})
export class PromoteLeadClientDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly dialogRef = inject(
    MatDialogRef<PromoteLeadClientDialogComponent, LeadResponseDto>,
  );
  protected readonly data = inject<PromoteLeadClientDialogData>(MAT_DIALOG_DATA);

  protected readonly ClientType = ClientType;
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly serverFieldErrors = signal<Record<string, string>>({});

  protected readonly form = this.fb.nonNullable.group({
    type: [this.normalizeClientType(this.data.lead.clientType), Validators.required],
    fullName: [this.data.lead.clientName ?? '', Validators.required],
    phone: [this.data.lead.contactPhone ?? ''],
    email: [this.data.lead.contactEmail ?? '', Validators.email],
    telegramHandle: [''],
    notes: [''],
    companyName: [this.data.lead.companyName ?? ''],
    legalAddress: [''],
    unp: ['', Validators.pattern(/^\d{9}$/)],
    okpo: [''],
    iban: [''],
    bankName: [''],
    bik: [''],
    dataConsentGiven: [false, Validators.requiredTrue],
    dataConsentDate: ['', Validators.required],
  });

  protected readonly isCompanyType = computed(() => {
    const type = this.form.controls.type.value;

    return type === ClientType.COMPANY || type === ClientType.B2B_AGENT;
  });

  constructor() {
    this.syncCompanyValidators();
    this.syncConsentDate();
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected hasServerError(controlName: FormControlKey): boolean {
    const control = this.form.controls[controlName];

    return control.hasError('server') && Boolean(this.serverFieldErrors()[controlName]);
  }

  protected serverErrorText(controlName: FormControlKey): string {
    return this.serverFieldErrors()[controlName] ?? '';
  }

  protected submit(): void {
    this.submitError.set('');
    this.clearServerErrors();

    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();

      return;
    }

    const value = this.form.getRawValue();
    const dto: PromoteLeadToClientDto = {
      type: value.type,
      fullName: value.fullName.trim(),
      dataConsentGiven: value.dataConsentGiven,
      dataConsentDate: value.dataConsentDate,
    };

    if (value.phone.trim()) {
      dto.phone = value.phone.trim();
    }

    if (value.email.trim()) {
      dto.email = value.email.trim();
    }

    if (value.telegramHandle.trim()) {
      dto.telegramHandle = value.telegramHandle.trim();
    }

    if (value.notes.trim()) {
      dto.notes = value.notes.trim();
    }

    if (this.isCompanyType()) {
      dto.companyName = value.companyName.trim();
      dto.legalAddress = value.legalAddress.trim();

      if (value.unp.trim()) {
        dto.unp = value.unp.trim();
      }

      if (value.okpo.trim()) {
        dto.okpo = value.okpo.trim();
      }

      if (value.iban.trim()) {
        dto.iban = value.iban.trim();
      }

      if (value.bankName.trim()) {
        dto.bankName = value.bankName.trim();
      }

      if (value.bik.trim()) {
        dto.bik = value.bik.trim();
      }
    }

    this.submitting.set(true);
    this.leadsService.promoteToClient(this.data.lead.id, dto).subscribe({
      next: (result) => {
        this.dialogRef.close(result.lead);
      },
      error: (error: unknown) => {
        this.handleSubmitError(error);
        this.submitting.set(false);
      },
      complete: () => {
        this.submitting.set(false);
      },
    });
  }

  private syncCompanyValidators(): void {
    this.form.controls.type.valueChanges.subscribe((type) => {
      const isCompany = type === ClientType.COMPANY || type === ClientType.B2B_AGENT;

      if (isCompany) {
        this.form.controls.companyName.setValidators(Validators.required);
        this.form.controls.legalAddress.setValidators(Validators.required);
      } else {
        this.form.controls.companyName.clearValidators();
        this.form.controls.legalAddress.clearValidators();
      }

      this.form.controls.companyName.updateValueAndValidity({ emitEvent: false });
      this.form.controls.legalAddress.updateValueAndValidity({ emitEvent: false });
    });

    const initialType = this.form.controls.type.value;
    const initialIsCompany =
      initialType === ClientType.COMPANY || initialType === ClientType.B2B_AGENT;

    if (initialIsCompany) {
      this.form.controls.companyName.setValidators(Validators.required);
      this.form.controls.legalAddress.setValidators(Validators.required);
      this.form.controls.companyName.updateValueAndValidity({ emitEvent: false });
      this.form.controls.legalAddress.updateValueAndValidity({ emitEvent: false });
    }
  }

  private syncConsentDate(): void {
    this.form.controls.dataConsentGiven.valueChanges.subscribe((checked) => {
      if (!checked) {
        this.form.controls.dataConsentDate.setValue('', { emitEvent: false });

        return;
      }

      if (!this.form.controls.dataConsentDate.value) {
        this.form.controls.dataConsentDate.setValue(new Date().toISOString().slice(0, 10), {
          emitEvent: false,
        });
      }
    });
  }

  private clearServerErrors(): void {
    this.serverFieldErrors.set({});

    for (const key of Object.keys(this.form.controls) as FormControlKey[]) {
      const control = this.form.controls[key];

      if (!control.hasError('server')) {
        continue;
      }

      const errors = { ...(control.errors ?? {}) };

      delete errors['server'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private handleSubmitError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.submitError.set('Failed to save client from lead');

      return;
    }

    if (error.status === 409) {
      this.submitError.set(
        "This lead is already linked to a client. Use 'Change client' to re-link.",
      );

      return;
    }

    if (error.status !== 422) {
      this.submitError.set(
        error.error?.message ?? error.message ?? 'Failed to save client from lead',
      );

      return;
    }

    const fieldErrors = this.extractFieldErrors(
      error.error?.errors ?? error.error?.fieldErrors ?? null,
    );

    if (fieldErrors === null) {
      this.submitError.set(error.error?.message ?? 'Validation failed');

      return;
    }

    this.serverFieldErrors.set(fieldErrors);

    for (const key of Object.keys(fieldErrors) as FormControlKey[]) {
      const control = this.form.controls[key];

      if (!control) {
        continue;
      }

      control.setErrors({ ...(control.errors ?? {}), server: true });
      control.markAsTouched();
    }
  }

  private normalizeClientType(type: string | null): ClientType {
    if (type === ClientType.COMPANY || type === ClientType.B2B_AGENT) {
      return type;
    }

    return ClientType.INDIVIDUAL;
  }

  private extractFieldErrors(value: unknown): Record<string, string> | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }

    const entries = Object.entries(value as Record<string, unknown>).filter(([, message]) => {
      return typeof message === 'string' && message.length > 0;
    });

    if (entries.length === 0) {
      return null;
    }

    return Object.fromEntries(entries) as Record<string, string>;
  }
}
