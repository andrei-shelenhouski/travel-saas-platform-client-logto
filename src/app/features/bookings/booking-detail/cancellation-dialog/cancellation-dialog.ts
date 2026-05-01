import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_BUTTONS, MAT_DIALOG, MAT_FORM_BUTTONS } from '@app/shared/material-imports';

export type CancellationResult = { reason: string };

@Component({
  selector: 'app-cancellation-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_DIALOG],
  template: `
    <div
      aria-labelledby="cancel-dialog-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
    >
      <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-gray-900" id="cancel-dialog-title">
          Отмена бронирования
        </h2>

        <form class="mt-4 space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field class="w-full">
            <mat-label>Причина отмены</mat-label>
            <textarea
              cdkAutosizeMaxRows="6"
              cdkAutosizeMinRows="3"
              formControlName="reason"
              matInput
              placeholder="Укажите причину отмены..."
            ></textarea>
            @if (form.controls.reason.hasError('required')) {
              <mat-error>Причина отмены обязательна</mat-error>
            }
          </mat-form-field>

          <div class="flex justify-end gap-3">
            <button mat-button type="button" (click)="cancelled.emit()">Отмена</button>
            <button color="warn" mat-flat-button type="submit" [disabled]="form.invalid">
              Подтвердить
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CancellationDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly confirmed = output<CancellationResult>();
  readonly cancelled = output<void>();

  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(1)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.confirmed.emit({ reason: this.form.getRawValue().reason.trim() });
  }
}
