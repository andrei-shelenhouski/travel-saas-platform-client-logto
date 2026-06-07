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

import type { PersonDocumentResponseDto } from '@app/shared/models';

export type PersonDocumentDialogData = {
  personId: string;
  mode: 'create' | 'edit';
  document?: PersonDocumentResponseDto;
};

export type PersonDocumentDialogResult = { saved: true } | undefined;

@Component({
  selector: 'app-person-document-dialog',
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
  templateUrl: './person-document-dialog.html',
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
export class PersonDocumentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogRef = inject(
    MatDialogRef<PersonDocumentDialogComponent, PersonDocumentDialogResult>,
  );
  protected readonly data = inject<PersonDocumentDialogData>(MAT_DIALOG_DATA);

  protected readonly submitting = signal(false);

  protected readonly typeOptions = [
    { value: 'INTL_PASSPORT', label: 'Загранпаспорт' },
    { value: 'NATIONAL_PASSPORT', label: 'Внутренний паспорт' },
    { value: 'NATIONAL_ID', label: 'Национальный ID' },
    { value: 'BIRTH_CERTIFICATE', label: 'Свидетельство о рождении' },
    { value: 'OTHER', label: 'Другой' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    type: ['INTL_PASSPORT', Validators.required],
    number: ['', Validators.required],
    series: [''],
    issueDate: [''],
    expiryDate: [''],
    issuedBy: [''],
    primary: [false],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.document) {
      const d = this.data.document;
      // number is not pre-filled (masked on server); user must re-enter
      this.form.patchValue({
        type: d.type,
        series: d.series ?? '',
        issueDate: d.issueDate ?? '',
        expiryDate: d.expiryDate ?? '',
        issuedBy: d.issuedBy ?? '',
        primary: d.primary,
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
      type: raw.type,
      number: raw.number.trim(),
      series: raw.series.trim() || undefined,
      issueDate: raw.issueDate || undefined,
      expiryDate: raw.expiryDate || undefined,
      issuedBy: raw.issuedBy.trim() || undefined,
      primary: raw.primary || undefined,
    };

    this.submitting.set(true);

    const request$ =
      this.data.mode === 'create'
        ? this.personsService.addDocument(this.data.personId, dto)
        : this.personsService.updateDocument(this.data.personId, this.data.document!.id, dto);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => this.dialogRef.close({ saved: true }),
      error: (err) =>
        this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить документ', 'Закрыть', {
          duration: 5000,
        }),
    });
  }
}
