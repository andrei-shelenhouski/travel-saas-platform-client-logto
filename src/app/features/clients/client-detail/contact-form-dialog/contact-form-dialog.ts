import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';

import type { ContactResponseDto, CreateContactDto, UpdateContactDto } from '@app/shared/models';

export type ContactFormDialogData = {
  clientId: string;
  mode: 'create' | 'edit';
  contact?: ContactResponseDto;
};

export type ContactFormDialogResult =
  | { saved: true; contact: ContactResponseDto }
  | { saved: false };

function atLeastOneContactMethodValidator(control: AbstractControl): ValidationErrors | null {
  const phone = (control.get('phone')?.value as string | undefined) ?? '';
  const email = (control.get('email')?.value as string | undefined) ?? '';
  const telegramHandle = (control.get('telegramHandle')?.value as string | undefined) ?? '';

  if (!phone.trim() && !email.trim() && !telegramHandle.trim()) {
    return { atLeastOneContactRequired: true };
  }

  return null;
}

@Component({
  selector: 'app-contact-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './contact-form-dialog.html',
  styleUrl: './contact-form-dialog.scss',
})
export class ContactFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogRef = inject(
    MatDialogRef<ContactFormDialogComponent, ContactFormDialogResult>,
  );
  protected readonly data = inject<ContactFormDialogData>(MAT_DIALOG_DATA);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', Validators.required],
      role: [''],
      phone: ['', Validators.pattern(/^\+?\d{7,15}$/)],
      email: ['', Validators.email],
      telegramHandle: ['', Validators.maxLength(60)],
      isPrimary: [false],
    },
    { validators: [atLeastOneContactMethodValidator] },
  );

  constructor() {
    if (this.data.mode === 'edit' && this.data.contact) {
      const c = this.data.contact;
      this.form.patchValue({
        fullName: c.fullName ?? '',
        role: c.role ?? '',
        phone: c.phone ?? '',
        email: c.email ?? '',
        telegramHandle: c.telegramHandle ?? '',
        isPrimary: c.primary,
      });
    }
  }

  protected get showContactMethodError(): boolean {
    const ctrl = this.form;

    return (
      ctrl.hasError('atLeastOneContactRequired') &&
      (ctrl.controls.phone.touched ||
        ctrl.controls.email.touched ||
        ctrl.controls.telegramHandle.touched)
    );
  }

  protected cancel(): void {
    this.dialogRef.close({ saved: false });
  }

  protected submit(): void {
    if (this.submitting() || this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const raw = this.form.getRawValue();

    if (this.data.mode === 'create') {
      const dto: CreateContactDto = {
        fullName: raw.fullName.trim(),
        role: raw.role.trim() || undefined,
        phone: raw.phone.trim() || undefined,
        email: raw.email.trim() || undefined,
        telegramHandle: raw.telegramHandle.trim() || undefined,
        isPrimary: raw.isPrimary || undefined,
      };

      this.submitting.set(true);
      this.clientsService
        .createContact(this.data.clientId, dto)
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (contact) => this.dialogRef.close({ saved: true, contact }),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось создать контакт', 'Close', {
              duration: 5000,
            }),
        });
    } else {
      const dto: UpdateContactDto = {
        fullName: raw.fullName.trim() || undefined,
        role: raw.role.trim() || undefined,
        phone: raw.phone.trim() || undefined,
        email: raw.email.trim() || undefined,
        telegramHandle: raw.telegramHandle.trim() || undefined,
        isPrimary: raw.isPrimary || undefined,
      };

      this.submitting.set(true);
      this.clientsService
        .updateContact(this.data.clientId, this.data.contact!.id, dto)
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (contact) => this.dialogRef.close({ saved: true, contact }),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось обновить контакт', 'Close', {
              duration: 5000,
            }),
        });
    }
  }
}
