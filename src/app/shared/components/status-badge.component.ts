import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusBadgeVariant = 'lead' | 'offer' | 'generic';

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: '#2b9db8',
  ASSIGNED: '#784d90',
  IN_PROGRESS: '#d97706',
  OFFER_SENT: '#41636e',
  WON: '#16a34a',
  LOST: '#73787a',
  EXPIRED: '#ba1a1a',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  OFFER_SENT: 'Offer sent',
  WON: 'Won',
  LOST: 'Lost',
  EXPIRED: 'Expired',
};

const OFFER_STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-sky-100 text-sky-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class]="badgeClass()"
      [style.background-color]="badgeBackgroundColor()"
      [style.color]="badgeTextColor()"
    >
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  /** Current status value (e.g. NEW, DRAFT). */
  readonly status = input<string | null | undefined>(null);
  /** Which color set to use. */
  readonly variant = input<StatusBadgeVariant>('generic');

  label(): string {
    const s = this.status();

    if (!s) {
      return '—';
    }

    if (this.variant() === 'lead') {
      return LEAD_STATUS_LABELS[s] ?? s;
    }

    return s;
  }

  badgeBackgroundColor(): string {
    const s = this.status();

    if (this.variant() === 'lead' && s) {
      return LEAD_STATUS_COLORS[s] ?? '#6b7280';
    }

    return '';
  }

  badgeTextColor(): string {
    const s = this.status();

    if (this.variant() === 'lead' && s) {
      return '#ffffff';
    }

    return '';
  }

  badgeClass(): string {
    const v = this.variant();
    const s = this.status();

    if (!s) {
      return 'bg-gray-100 text-gray-500';
    }

    if (v === 'lead') {
      return 'border border-transparent';
    }

    if (v === 'offer') {
      return OFFER_STATUS_CLASS[s] ?? 'bg-gray-100 text-gray-600';
    }

    return 'bg-gray-100 text-gray-600';
  }
}
