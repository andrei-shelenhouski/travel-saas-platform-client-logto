import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';

import type { PersonContactResponseDto } from '@app/shared/models';

export type PersonContactDialogData = {
  personId: string;
  mode: 'create' | 'edit';
  contact?: PersonContactResponseDto;
};

export type PersonContactDialogResult = { saved: true } | undefined;

@Component({
  selector: 'app-person-contact-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './person-contact-dialog.html',
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 8px;
      }
      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class PersonContactDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogRef = inject(
    MatDialogRef<PersonContactDialogComponent, PersonContactDialogResult>,
  );
  protected readonly data = inject<PersonContactDialogData>(MAT_DIALOG_DATA);

  protected readonly submitting = signal(false);

  protected readonly mediumOptions = [
    { value: 'EMAIL', label: 'Email' },
    { value: 'PHONE', label: 'Телефон' },
    { value: 'TELEGRAM', label: 'Telegram' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    medium: ['EMAIL', Validators.required],
    value: ['', Validators.required],
    primary: [false],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.contact) {
      const c = this.data.contact;
      this.form.patchValue({
        medium: c.medium,
        value: c.value,
        primary: c.primary,
      });
    }
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  protected submit(): void {
    if (this.submitting() || this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const raw = this.form.getRawValue();
    const dto = {
      medium: raw.medium as 'EMAIL' | 'PHONE' | 'TELEGRAM',
      value: raw.value.trim(),
      primary: raw.primary || undefined,
    };

    this.submitting.set(true);

    const request$ =
      this.data.mode === 'create'
        ? this.personsService.addContact(this.data.personId, dto)
        : this.personsService.updateContact(this.data.personId, this.data.contact!.id, dto);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => this.dialogRef.close({ saved: true }),
      error: (err) =>
        this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить контакт', 'Закрыть', {
          duration: 5000,
        }),
    });
  }
}
