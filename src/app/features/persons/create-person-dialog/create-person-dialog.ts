import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { finalize } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';

import type { PersonResponseDto } from '@app/shared/models';

export type CreatePersonDialogResult = {
  created: true;
  person: PersonResponseDto;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-person-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './create-person-dialog.html',
  styleUrl: './create-person-dialog.scss',
})
export class CreatePersonDialogComponent {
  private readonly personsService = inject(PersonsService);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<CreatePersonDialogComponent, CreatePersonDialogResult>,
  );

  protected readonly saving = signal(false);
  protected readonly submitError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    patronymic: [''],
    lastNameTranslit: ['', Validators.pattern(/^[A-Z]*$/)],
    firstNameTranslit: ['', Validators.pattern(/^[A-Z]*$/)],
    dateOfBirth: [''],
    citizenship: [''],
    personalNumber: ['', Validators.pattern(/^[A-Z0-9]*$/)],
  });

  protected uppercaseOnBlur(controlName: keyof typeof this.form.controls): void {
    const ctrl = this.form.controls[controlName];

    ctrl.setValue((ctrl.value as string).toUpperCase().trim());
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const {
      lastName,
      firstName,
      patronymic,
      lastNameTranslit,
      firstNameTranslit,
      dateOfBirth,
      citizenship,
      personalNumber,
    } = this.form.getRawValue();

    this.saving.set(true);
    this.submitError.set('');

    this.personsService
      .create({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        patronymic: patronymic.trim() || undefined,
        lastNameTranslit: lastNameTranslit.trim() || undefined,
        firstNameTranslit: firstNameTranslit.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        citizenship: citizenship.trim() || undefined,
        personalNumber: personalNumber.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (person) => {
          this.dialogRef.close({ created: true, person });
        },
        error: (err: HttpErrorResponse) => {
          this.submitError.set(err.error?.message ?? err.message ?? 'Не удалось создать туриста');
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
