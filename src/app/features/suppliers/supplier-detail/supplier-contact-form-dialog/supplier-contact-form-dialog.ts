import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { SuppliersService } from '@app/services/suppliers.service';

import type {
  CreateSupplierContactRequest,
  SupplierContactResponse,
  UpdateSupplierContactRequest,
} from '@app/shared/models';

export type SupplierContactFormDialogData = {
  supplierId: string;
  mode: 'create' | 'edit';
  contact?: SupplierContactResponse;
};

export type SupplierContactFormDialogResult =
  | { saved: true; contact: SupplierContactResponse }
  | { saved: false };

@Component({
  selector: 'app-supplier-contact-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './supplier-contact-form-dialog.html',
})
export class SupplierContactFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly suppliersService = inject(SuppliersService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogRef = inject(
    MatDialogRef<SupplierContactFormDialogComponent, SupplierContactFormDialogResult>,
  );
  protected readonly data = inject<SupplierContactFormDialogData>(MAT_DIALOG_DATA);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    role: [''],
    phone: ['', Validators.pattern(/^\+?\d{7,15}$/)],
    email: ['', Validators.email],
    telegramHandle: ['', Validators.maxLength(60)],
    isPrimary: [false],
  });

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
      const dto: CreateSupplierContactRequest = {
        fullName: raw.fullName.trim(),
        role: raw.role.trim() || null,
        phone: raw.phone.trim() || null,
        email: raw.email.trim() || null,
        telegramHandle: raw.telegramHandle.trim() || null,
        isPrimary: raw.isPrimary || null,
      };

      this.submitting.set(true);
      this.suppliersService
        .createContact(this.data.supplierId, dto)
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (contact) => this.dialogRef.close({ saved: true, contact }),
          error: (err: { error?: { message?: string } }) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось создать контакт', 'Close', {
              duration: 5000,
            }),
        });
    } else {
      const dto: UpdateSupplierContactRequest = {
        fullName: raw.fullName.trim() || undefined,
        role: raw.role.trim() || null,
        phone: raw.phone.trim() || null,
        email: raw.email.trim() || null,
        telegramHandle: raw.telegramHandle.trim() || null,
        isPrimary: raw.isPrimary || null,
      };

      this.submitting.set(true);
      this.suppliersService
        .updateContact(this.data.supplierId, this.data.contact!.id, dto)
        .pipe(finalize(() => this.submitting.set(false)))
        .subscribe({
          next: (contact) => this.dialogRef.close({ saved: true, contact }),
          error: (err: { error?: { message?: string } }) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось обновить контакт', 'Close', {
              duration: 5000,
            }),
        });
    }
  }
}
