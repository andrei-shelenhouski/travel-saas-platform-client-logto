import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize } from 'rxjs/operators';

import { PersonsService } from '@app/services/persons.service';
import { PageContentComponent } from '@app/shared/components';
import { FormSectionComponent } from '@app/shared/components/form-section/form-section';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';

import type { UpdatePersonRequestDto } from '@app/shared/models';

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  OTHER: 'Другой',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-edit-person-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeading,
    PageHeadingAction,
    PageContentComponent,
    FormSectionComponent,
  ],
  templateUrl: './edit-person-page.html',
  styleUrl: './edit-person-page.scss',
})
export class EditPersonPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly genderOptions = Object.entries(GENDER_LABEL).map(([value, label]) => ({ value, label }));

  readonly form = this.fb.nonNullable.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    patronymic: [''],
    lastNameTranslit: ['', Validators.pattern(/^[A-Z]*$/)],
    firstNameTranslit: ['', Validators.pattern(/^[A-Z]*$/)],
    dateOfBirth: [''],
    gender: [''],
    citizenship: [''],
    personalNumber: ['', Validators.pattern(/^[A-Z0-9]*$/)],
    notes: [''],
  });

  private personId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id === null) {
      void this.router.navigate(['..'], { relativeTo: this.route });

      return;
    }

    this.personId = id;
    this.loadPerson(id);
  }

  cancel(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  uppercaseOnBlur(controlName: keyof typeof this.form.controls): void {
    const ctrl = this.form.controls[controlName];
    ctrl.setValue(ctrl.value.toUpperCase().trim());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const id = this.personId;

    if (id === null || this.saving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const dto: UpdatePersonRequestDto = {
      lastName: raw.lastName.trim(),
      firstName: raw.firstName.trim(),
      patronymic: raw.patronymic.trim() || undefined,
      lastNameTranslit: raw.lastNameTranslit.trim() || undefined,
      firstNameTranslit: raw.firstNameTranslit.trim() || undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      gender: raw.gender || undefined,
      citizenship: raw.citizenship.trim() || undefined,
      personalNumber: raw.personalNumber.trim() || undefined,
      notes: raw.notes.trim() || undefined,
    };

    this.saving.set(true);
    this.personsService
      .update(id, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Данные сохранены', 'Close', { duration: 3000 });
          void this.router.navigate(['..'], { relativeTo: this.route });
        },
        error: (err) =>
          this.snackBar.open(err?.error?.message ?? 'Не удалось сохранить', 'Close', {
            duration: 5000,
          }),
      });
  }

  private loadPerson(id: string): void {
    this.loading.set(true);

    this.personsService.getById(id).subscribe({
      next: (person) => {
        this.form.patchValue({
          lastName: person.lastName,
          firstName: person.firstName,
          patronymic: person.patronymic ?? '',
          lastNameTranslit: person.lastNameTranslit ?? '',
          firstNameTranslit: person.firstNameTranslit ?? '',
          dateOfBirth: person.dateOfBirth ?? '',
          gender: person.gender ?? '',
          citizenship: person.citizenship ?? '',
          personalNumber: person.personalNumber ?? '',
          notes: person.notes ?? '',
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message ?? 'Не удалось загрузить данные туриста', 'Close', {
          duration: 5000,
        });
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
    });
  }
}
