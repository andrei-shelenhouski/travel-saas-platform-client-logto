import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING_CONFIRMATION: '#d97706',
  CONFIRMED: '#2b9db8',
  IN_PROGRESS: '#41636e',
  COMPLETED: '#16a34a',
  CANCELLED: '#73787a',
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Pending confirmation',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

@Component({
  selector: 'app-booking-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-status-chip.html',
  styleUrl: './booking-status-chip.scss',
})
export class BookingStatusChipComponent {
  readonly status = input<string | null | undefined>(null);

  label(): string {
    const status = this.status();

    if (!status) {
      return '—';
    }

    return BOOKING_STATUS_LABELS[status] ?? status;
  }

  backgroundColor(): string {
    const status = this.status();

    if (!status) {
      return '#e5e7eb';
    }

    return BOOKING_STATUS_COLORS[status] ?? '#73787a';
  }
}
