import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
  PENDING_CONFIRMATION: $localize`:@@bookingStatusOptionPendingConfirmation:Pending confirmation`,
  PENDING: $localize`:@@bookingStatusOptionPending:Pending`,
  CONFIRMED: $localize`:@@bookingStatusOptionConfirmed:Confirmed`,
  IN_PROGRESS: $localize`:@@bookingStatusOptionInProgress:In progress`,
  COMPLETED: $localize`:@@bookingStatusOptionCompleted:Completed`,
  PAID: $localize`:@@bookingStatusOptionPaid:Paid`,
  CANCELLED: $localize`:@@bookingStatusOptionCancelled:Cancelled`,
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

  textColor(): string {
    const status = this.status();

    if (!status || !(status in BOOKING_STATUS_COLORS)) {
      return '#1f2937';
    }

    return '#ffffff';
  }
}
