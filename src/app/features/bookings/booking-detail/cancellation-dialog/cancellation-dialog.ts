import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_BUTTONS, MAT_DIALOG, MAT_FORM_BUTTONS } from '@app/shared/material-imports';

export type CancellationResult = { reason: string };

@Component({
  selector: 'app-cancellation-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_DIALOG],
  templateUrl: './cancellation-dialog.html',
  styleUrl: './cancellation-dialog.scss',
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
