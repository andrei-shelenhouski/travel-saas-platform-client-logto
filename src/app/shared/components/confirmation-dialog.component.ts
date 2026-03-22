import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirmation-dialog',
  standalone: true,
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
            <button
              class="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              type="button"
              (click)="cancel.emit()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              class="rounded px-4 py-2 text-sm font-medium"
              type="button"
              [class]="
                danger()
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-primary text-primary-foreground hover:bg-primary-hover'
              "
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
