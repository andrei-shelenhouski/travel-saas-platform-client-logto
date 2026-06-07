import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';

import { PersonsService } from '@app/services/persons.service';

export type PersonConsentDialogData = { personId: string };
export type PersonConsentDialogResult = { saved: true } | undefined;

@Component({
  selector: 'app-person-consent-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './person-consent-dialog.html',
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
export class PersonConsentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogRef = inject(
    MatDialogRef<PersonConsentDialogComponent, PersonConsentDialogResult>,
  );
  protected readonly data = inject<PersonConsentDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    consentDate: [new Date().toLocaleDateString('sv')],
    confirmed: [false, Validators.requiredTrue],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const { consentDate } = this.form.getRawValue();

    this.saving.set(true);
    this.personsService
      .update(this.data.personId, { dataConsentGiven: true, dataConsentDate: consentDate })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Согласие зафиксировано', 'Close', { duration: 3000 });
          this.dialogRef.close({ saved: true });
        },
        error: (err) =>
          this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить согласие', 'Close', {
            duration: 5000,
          }),
      });
  }
}
