import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';
import { MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import {
  CreateDetachedPersonRequestDto,
  PersonRelationshipType,
  PersonSearchResultDto,
} from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

type AddFamilyMemberDialogData = {
  personId: string;
};

type AddFamilyMemberDialogResult = {
  saved: boolean;
};

type Step = 1 | 2 | 3;
type Mode = 'create' | 'link';

const RELATION_LABEL: Record<string, string> = {
  SPOUSE_OF: 'Супруг(а)',
  PARENT_OF: 'Родитель',
  SIBLING_OF: 'Брат/сестра',
  GRANDPARENT_OF: 'Бабушка/дедушка',
  OTHER: 'Другое',
};

@Component({
  selector: 'app-add-family-member-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS],
  templateUrl: './add-family-member-dialog.html',
  styleUrl: './add-family-member-dialog.scss',
})
export class AddFamilyMemberDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly dialogRef = inject(
    MatDialogRef<AddFamilyMemberDialogComponent, AddFamilyMemberDialogResult>,
  );
  protected readonly data = inject<AddFamilyMemberDialogData>(MAT_DIALOG_DATA);

  protected readonly step = signal<Step>(1);
  protected readonly mode = signal<Mode>('create');
  protected readonly submitting = signal(false);
  protected readonly searching = signal(false);
  protected readonly searchResults = signal<PersonSearchResultDto[]>([]);
  protected readonly selectedPerson = signal<PersonSearchResultDto | null>(null);

  protected readonly relationOptions = Object.entries(RELATION_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  protected readonly createForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    patronymic: [''],
    dateOfBirth: [''],
    citizenship: [''],
    relationType: [PersonRelationshipType.OTHER, Validators.required],
  });

  protected readonly linkForm = this.fb.nonNullable.group({
    query: [''],
    relationType: [PersonRelationshipType.OTHER, Validators.required],
    selectedPersonId: [''],
  });

  constructor() {
    this.linkForm.controls.query.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (this.mode() !== 'link' || query.trim().length < 2) {
            this.searching.set(false);
            this.searchResults.set([]);

            return of<PersonSearchResultDto[]>([]);
          }

          this.searching.set(true);

          return this.personsService.search(query).pipe(
            finalize(() => {
              this.searching.set(false);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
      });
  }

  protected get selectedRelationLabel(): string {
    const relationType =
      this.mode() === 'create'
        ? this.createForm.controls.relationType.value
        : this.linkForm.controls.relationType.value;

    return RELATION_LABEL[relationType] ?? relationType;
  }

  protected onModeChange(nextMode: Mode): void {
    this.mode.set(nextMode);
    this.selectedPerson.set(null);
    this.searchResults.set([]);
    this.linkForm.controls.selectedPersonId.setValue('');
  }

  protected selectPerson(person: PersonSearchResultDto): void {
    this.selectedPerson.set(person);
    this.linkForm.controls.selectedPersonId.setValue(person.id);
  }

  protected goNext(): void {
    const currentStep = this.step();

    if (currentStep === 1) {
      this.step.set(2);

      return;
    }

    if (currentStep === 2) {
      if (this.mode() === 'create') {
        if (this.createForm.invalid) {
          this.createForm.markAllAsTouched();

          return;
        }
      }

      if (this.mode() === 'link') {
        if (!this.linkForm.controls.selectedPersonId.value) {
          this.linkForm.controls.selectedPersonId.markAsTouched();

          return;
        }
      }

      this.step.set(3);
    }
  }

  protected goBack(): void {
    const currentStep = this.step();

    if (currentStep === 3) {
      this.step.set(2);

      return;
    }

    if (currentStep === 2) {
      this.step.set(1);
    }
  }

  protected cancel(): void {
    this.dialogRef.close({ saved: false });
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);

    if (this.mode() === 'create') {
      const raw = this.createForm.getRawValue();
      const dto: CreateDetachedPersonRequestDto = {
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        patronymic: raw.patronymic || undefined,
        dateOfBirth: raw.dateOfBirth || undefined,
        citizenship: raw.citizenship || undefined,
      };

      this.personsService
        .create(dto)
        .pipe(
          switchMap((created) =>
            this.personsService.addRelationship(this.data.personId, {
              toPersonId: created.id,
              type: raw.relationType,
            }),
          ),
          finalize(() => this.submitting.set(false)),
        )
        .subscribe({
          next: () => this.dialogRef.close({ saved: true }),
          error: () =>
            this.snackBar.open('Не удалось добавить члена семьи', 'Close', { duration: 5000 }),
        });

      return;
    }

    const relationType = this.linkForm.controls.relationType.value;
    const selectedPersonId = this.linkForm.controls.selectedPersonId.value;

    this.personsService
      .addRelationship(this.data.personId, {
        toPersonId: selectedPersonId,
        type: relationType,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close({ saved: true }),
        error: () => this.snackBar.open('Не удалось добавить связь', 'Close', { duration: 5000 }),
      });
  }
}
