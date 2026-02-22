import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

/**
 * Simple toast notifications. No global component required;
 * consumers can bind to toast() and render a small toast UI.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toast = signal<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  readonly toast = this._toast.asReadonly();

  show(message: string, type: ToastType = 'info'): void {
    this._toast.set({ message, type, visible: true });
    setTimeout(() => this.hide(), 4000);
  }

  showError(message: string): void {
    this.show(message, 'error');
  }

  showSuccess(message: string): void {
    this.show(message, 'success');
  }

  hide(): void {
    this._toast.update((s) => ({ ...s, visible: false }));
  }
}
