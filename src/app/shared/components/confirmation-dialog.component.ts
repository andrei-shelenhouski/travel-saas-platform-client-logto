import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirmation-dialog',
  imports: [...MAT_FORM_BUTTONS],
  template: `
    @if (open()) {
      <div
        aria-labelledby="confirm-title"
        aria-modal="true"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        role="dialog"
      >
        <div class="mx-4 w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900" id="confirm-title">
            {{ title() }}
          </h2>
          <p class="mt-2 text-sm text-gray-600">{{ message() }}</p>
          <div class="mt-5 flex justify-end gap-3">
            <button mat-button type="button" (click)="cancel.emit()">
              {{ cancelLabel() }}
            </button>
            <button
              mat-flat-button
              type="button"
              [color]="danger() ? 'warn' : 'primary'"
              (click)="confirm.emit()"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmationDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Confirm');
  readonly message = input<string>('');
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly danger = input<boolean>(false);

  readonly confirm = output<void>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly cancel = output<void>();
}
