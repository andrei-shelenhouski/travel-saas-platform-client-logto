import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormRecord,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { CustomFieldType } from '@app/shared/models';

import type { CustomFieldType as CustomFieldTypeValue } from '@app/shared/models';

export type CustomFieldSectionField = {
  definitionId: string;
  name: string;
  fieldType: CustomFieldTypeValue;
  options: string[];
  value: string;
  required: boolean;
  sortOrder: number;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-custom-fields-section',
  imports: [ReactiveFormsModule, MatIconModule, ...MAT_BUTTONS, ...MAT_FORM_BUTTONS],
  templateUrl: './custom-fields-section.html',
  styleUrl: './custom-fields-section.scss',
})
export class CustomFieldsSectionComponent {
  private readonly fb = inject(FormBuilder);

  readonly title = input('Дополнительные поля');
  readonly fields = input<CustomFieldSectionField[]>([]);
  readonly canEdit = input(true);
  readonly saving = input(false);

  readonly saveRequested = output<Record<string, string>>();

  protected readonly fieldType = CustomFieldType;
  protected readonly expanded = signal(false);
  protected readonly editing = signal(false);
  protected readonly statusValidationMessage = signal<string | null>(null);

  protected readonly sortedFields = computed(() => {
    return [...this.fields()].sort((a, b) => a.sortOrder - b.sortOrder);
  });

  protected readonly form = new FormRecord<FormControl<string>>({});

  constructor() {
    effect(() => {
      this.rebuildForm(this.sortedFields());
    });
  }

  protected toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }

  protected startEdit(): void {
    if (!this.canEdit()) {
      return;
    }

    this.expanded.set(true);
    this.statusValidationMessage.set(null);
    this.editing.set(true);
    this.rebuildForm(this.sortedFields());
  }

  protected cancelEdit(): void {
    this.statusValidationMessage.set(null);
    this.editing.set(false);
    this.rebuildForm(this.sortedFields());
  }

  protected save(): void {
    if (!this.canEdit()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const values: Record<string, string> = {};

    for (const field of this.sortedFields()) {
      const controlValue = this.form.controls[field.definitionId]?.value ?? '';

      values[field.definitionId] = controlValue;
    }

    this.statusValidationMessage.set(null);
    this.saveRequested.emit(values);
  }

  ensureRequiredFieldsFilledForStatusChange(): boolean {
    const missingRequired = this.sortedFields().filter((field) => {
      if (!field.required) {
        return false;
      }

      const value = this.editing()
        ? (this.form.controls[field.definitionId]?.value ?? '').trim()
        : (field.value ?? '').trim();

      return value.length === 0;
    });

    if (missingRequired.length === 0) {
      this.statusValidationMessage.set(null);

      return true;
    }

    this.expanded.set(true);
    this.statusValidationMessage.set(
      `Заполните обязательные дополнительные поля: ${missingRequired.map((field) => field.name).join(', ')}`,
    );

    if (!this.editing() && this.canEdit()) {
      this.editing.set(true);
      this.rebuildForm(this.sortedFields());
    }

    for (const field of missingRequired) {
      this.form.controls[field.definitionId]?.markAsTouched();
    }

    return false;
  }

  protected isRequiredError(definitionId: string): boolean {
    const control = this.form.controls[definitionId];

    if (!control) {
      return false;
    }

    return control.touched && control.hasError('required');
  }

  private rebuildForm(fields: CustomFieldSectionField[]): void {
    const nextControlNames = new Set(fields.map((field) => field.definitionId));

    for (const currentName of Object.keys(this.form.controls)) {
      if (!nextControlNames.has(currentName)) {
        this.form.removeControl(currentName);
      }
    }

    for (const field of fields) {
      const existingControl = this.form.controls[field.definitionId];
      const validators = field.required ? [Validators.required] : [];

      if (existingControl) {
        existingControl.setValidators(validators);
        existingControl.setValue(field.value ?? '');
        existingControl.updateValueAndValidity({ emitEvent: false });

        continue;
      }

      this.form.addControl(
        field.definitionId,
        this.fb.control(field.value ?? '', {
          nonNullable: true,
          validators,
        }),
      );
    }
  }
}
