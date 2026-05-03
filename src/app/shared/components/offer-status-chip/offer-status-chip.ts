import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export const OFFER_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#73787a',
  NEW: '#73787a',
  OPEN: '#2b9db8',
  SENT: '#d97706',
  OFFER_SENT: '#d97706',
  VIEWED: '#d97706',
  ACCEPTED: '#16a34a',
  WON: '#16a34a',
  REJECTED: '#ba1a1a',
  LOST: '#73787a',
  EXPIRED: '#ba1a1a',
  CLOSED: '#73787a',
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  DRAFT: $localize`:@@offerStatusDraft:Draft`,
  NEW: $localize`:@@offerStatusNew:New`,
  OPEN: $localize`:@@offerStatusOpen:Open`,
  SENT: $localize`:@@offerStatusSent:Sent`,
  OFFER_SENT: $localize`:@@offerStatusOfferSent:Offer sent`,
  VIEWED: $localize`:@@offerStatusViewed:Viewed`,
  ACCEPTED: $localize`:@@offerStatusAccepted:Accepted`,
  WON: $localize`:@@offerStatusWon:Won`,
  REJECTED: $localize`:@@offerStatusRejected:Rejected`,
  LOST: $localize`:@@offerStatusLost:Lost`,
  EXPIRED: $localize`:@@offerStatusExpired:Expired`,
  CLOSED: $localize`:@@offerStatusClosed:Closed`,
};

@Component({
  selector: 'app-offer-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offer-status-chip.html',
  styleUrl: './offer-status-chip.scss',
})
export class OfferStatusChipComponent {
  readonly status = input<string | null | undefined>(null);

  label(): string {
    const status = this.status();

    if (!status) {
      return '—';
    }

    return OFFER_STATUS_LABELS[status] ?? status;
  }

  backgroundColor(): string {
    const status = this.status();

    if (!status) {
      return '#e5e7eb';
    }

    return OFFER_STATUS_COLORS[status] ?? '#73787a';
  }

  textColor(): string {
    const status = this.status();

    if (!status || !(status in OFFER_STATUS_COLORS)) {
      return '#1f2937';
    }

    return '#ffffff';
  }
}
