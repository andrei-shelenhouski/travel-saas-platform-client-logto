import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  StatusChipComponent,
  type StatusChipConfig,
} from '@app/shared/components/status-chip/status-chip';

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING_CONFIRMATION: '#d97706',
  PENDING: '#d97706',
  CONFIRMED: '#2b9db8',
  IN_PROGRESS: '#41636e',
  COMPLETED: '#16a34a',
  PAID: '#16a34a',
  CANCELLED: '#73787a',
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Ожидает подтверждения',
  PENDING: 'В ожидании',
  CONFIRMED: 'Подтверждено',
  IN_PROGRESS: 'В поездке',
  COMPLETED: 'Завершено',
  PAID: 'Оплачено',
  CANCELLED: 'Отменено',
};

const BOOKING_STATUS_CONFIG: StatusChipConfig = Object.fromEntries(
  Object.keys(BOOKING_STATUS_LABELS).map((key) => [
    key,
    { label: BOOKING_STATUS_LABELS[key], backgroundColor: BOOKING_STATUS_COLORS[key] },
  ]),
);

@Component({
  selector: 'app-booking-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent],
  template: `<app-status-chip [config]="config" [status]="status()" />`,
})
export class BookingStatusChipComponent {
  readonly status = input<string | null | undefined>(null);
  protected readonly config = BOOKING_STATUS_CONFIG;
}
