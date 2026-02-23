import { Component, output, input } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div class="mx-4 w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
          <h2 id="confirm-title" class="text-lg font-semibold text-gray-900">
            {{ title() }}
          </h2>
          <p class="mt-2 text-sm text-gray-600">{{ message() }}</p>
          <div class="mt-5 flex justify-end gap-3">
            <button
              type="button"
              (click)="cancel.emit()"
              class="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {{ cancelLabel() }}
            </button>
            <button
              type="button"
              (click)="confirm.emit()"
              [class]="
                danger()
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-primary text-primary-foreground hover:bg-primary-hover'
              "
              class="rounded px-4 py-2 text-sm font-medium"
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
  open = input<boolean>(false);
  title = input<string>('Confirm');
  message = input<string>('');
  confirmLabel = input<string>('Confirm');
  cancelLabel = input<string>('Cancel');
  danger = input<boolean>(false);

  confirm = output<void>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  cancel = output<void>();
}
