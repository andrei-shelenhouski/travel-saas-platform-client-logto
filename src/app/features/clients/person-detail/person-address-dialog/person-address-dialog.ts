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

import type { PersonAddressResponseDto } from '@app/shared/models';

export type PersonAddressDialogData = {
  personId: string;
  mode: 'create' | 'edit';
  address?: PersonAddressResponseDto;
};

export type PersonAddressDialogResult = { saved: true } | undefined;

@Component({
  selector: 'app-person-address-dialog',
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
  templateUrl: './person-address-dialog.html',
})
export class PersonAddressDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly dialogRef = inject(
    MatDialogRef<PersonAddressDialogComponent, PersonAddressDialogResult>,
  );
  protected readonly data = inject<PersonAddressDialogData>(MAT_DIALOG_DATA);

  protected readonly submitting = signal(false);

  protected readonly typeOptions = [
    { value: 'REGISTRATION', label: 'Прописка' },
    { value: 'RESIDENTIAL', label: 'Фактический' },
    { value: 'OTHER', label: 'Другой' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    type: ['REGISTRATION', Validators.required],
    street: [''],
    city: [''],
    region: [''],
    country: [''],
    postalCode: [''],
    primary: [false],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.address) {
      const a = this.data.address;
      this.form.patchValue({
        type: a.type,
        street: a.street ?? '',
        city: a.city ?? '',
        region: a.region ?? '',
        country: a.country ?? '',
        postalCode: a.postalCode ?? '',
        primary: a.primary ?? false,
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
      type: raw.type as 'REGISTRATION' | 'RESIDENTIAL' | 'OTHER',
      street: raw.street.trim() || undefined,
      city: raw.city.trim() || undefined,
      region: raw.region.trim() || undefined,
      country: raw.country.trim() || undefined,
      postalCode: raw.postalCode.trim() || undefined,
      primary: raw.primary || undefined,
    };

    this.submitting.set(true);

    const request$ =
      this.data.mode === 'create'
        ? this.personsService.addAddress(this.data.personId, dto)
        : this.personsService.updateAddress(this.data.personId, this.data.address!.id, dto);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => this.dialogRef.close({ saved: true }),
      error: (err) =>
        this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить адрес', 'Закрыть', {
          duration: 5000,
        }),
    });
  }
}
