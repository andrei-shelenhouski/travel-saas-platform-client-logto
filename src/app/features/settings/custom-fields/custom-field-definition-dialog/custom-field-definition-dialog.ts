import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MAT_BUTTONS, MAT_DIALOG, MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { CustomFieldType } from '@app/shared/models';

import type {
  CreateCustomFieldDefinitionRequestDto,
  CustomFieldDefinitionRequestDto,
  CustomFieldDefinitionResponseDto,
  CustomFieldEntityType,
  CustomFieldType as CustomFieldTypeValue,
} from '@app/shared/models';

type CustomFieldDefinitionDialogData = {
  entityType: CustomFieldEntityType;
  definition?: CustomFieldDefinitionResponseDto;
};

export type CustomFieldDefinitionDialogResult = {
  payload: CreateCustomFieldDefinitionRequestDto | CustomFieldDefinitionRequestDto;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-custom-field-definition-dialog',
  imports: [ReactiveFormsModule, ...MAT_DIALOG, ...MAT_BUTTONS, ...MAT_FORM_BUTTONS],
  templateUrl: './custom-field-definition-dialog.html',
  styleUrl: './custom-field-definition-dialog.scss',
})
export class CustomFieldDefinitionDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<CustomFieldDefinitionDialogComponent, CustomFieldDefinitionDialogResult>,
  );
  private readonly data = inject<CustomFieldDefinitionDialogData>(MAT_DIALOG_DATA);

  protected readonly fieldTypes = [
    CustomFieldType.TEXT,
    CustomFieldType.TEXTAREA,
    CustomFieldType.DROPDOWN,
    CustomFieldType.DATE,
    CustomFieldType.URL,
  ] as const;

  protected readonly modeLabel = computed(() =>
    this.data.definition ? 'Редактировать' : 'Добавить',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.definition?.name ?? '', [Validators.required, Validators.maxLength(255)]],
    fieldType: [
      (this.data.definition?.fieldType ?? CustomFieldType.TEXT) as CustomFieldTypeValue,
      [Validators.required],
    ],
    required: [Boolean(this.data.definition?.required)],
    optionsText: [(this.data.definition?.options ?? []).join(', ')],
  });

  protected readonly isDropdown = computed(() => {
    return this.form.controls.fieldType.value === CustomFieldType.DROPDOWN;
  });

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const raw = this.form.getRawValue();
    const options = raw.optionsText
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (raw.fieldType === CustomFieldType.DROPDOWN && options.length === 0) {
      this.form.controls.optionsText.setErrors({ required: true });
      this.form.controls.optionsText.markAsTouched();

      return;
    }

    const payloadBase = {
      name: raw.name,
      fieldType: raw.fieldType,
      required: raw.required,
      options: raw.fieldType === CustomFieldType.DROPDOWN ? options : [],
    };

    if (this.data.definition) {
      this.dialogRef.close({ payload: payloadBase });

      return;
    }

    this.dialogRef.close({
      payload: {
        ...payloadBase,
        entityType: this.data.entityType,
      },
    });
  }
}
