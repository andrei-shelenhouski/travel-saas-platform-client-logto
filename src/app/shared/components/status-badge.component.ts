import { Component, input } from '@angular/core';

export type StatusBadgeVariant = 'lead' | 'offer' | 'generic';

const LEAD_STATUS_CLASS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  LOST: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-green-100 text-green-800',
};

const OFFER_STATUS_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class]="badgeClass()"
    >
      {{ status() ?? '—' }}
    </span>
  `,
})
export class StatusBadgeComponent {
  /** Current status value (e.g. NEW, DRAFT). */
  status = input<string | null | undefined>(null);
  /** Which color set to use. */
  variant = input<StatusBadgeVariant>('generic');

  badgeClass(): string {
    const v = this.variant();
    const s = this.status();
    if (!s) return 'bg-gray-100 text-gray-500';
    if (v === 'lead') return LEAD_STATUS_CLASS[s] ?? 'bg-gray-100 text-gray-600';
    if (v === 'offer') return OFFER_STATUS_CLASS[s] ?? 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-600';
  }
}
