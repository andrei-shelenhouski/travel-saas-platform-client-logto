import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '@app/shared/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toastService.toast().visible) {
      <div
        class="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg"
        role="alert"
        [class]="
          toastService.toast().type === 'error'
            ? 'bg-red-600 text-white'
            : toastService.toast().type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-white'
        "
      >
        {{ toastService.toast().message }}
      </div>
    }
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
