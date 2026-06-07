import { TextFieldModule } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type CancellationResult = { reason: string };

@Component({
  selector: 'app-cancellation-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
  ],
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
