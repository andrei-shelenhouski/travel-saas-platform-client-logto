import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { finalize } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { PersonResponseDto } from '@app/shared/models';

export type CreatePersonDialogResult = {
  created: true;
  person: PersonResponseDto;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-person-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, ...MAT_FORM_BUTTONS],
  templateUrl: './create-person-dialog.html',
  styleUrl: './create-person-dialog.scss',
})
export class CreatePersonDialogComponent {
  private readonly personsService = inject(PersonsService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<CreatePersonDialogComponent, CreatePersonDialogResult>,
  );

  protected readonly _data = inject(MAT_DIALOG_DATA, { optional: true });

  protected readonly saving = signal(false);
  protected readonly submitError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    patronymic: [''],
    dateOfBirth: [''],
    citizenship: [''],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const { lastName, firstName, patronymic, dateOfBirth, citizenship } = this.form.getRawValue();

    this.saving.set(true);
    this.submitError.set('');

    this.personsService
      .create({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        patronymic: patronymic.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        citizenship: citizenship.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (person) => {
          this.dialogRef.close({ created: true, person });
        },
        error: (err: HttpErrorResponse) => {
          this.submitError.set(
            err.error?.message ?? err.message ?? 'Не удалось создать туриста',
          );
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
