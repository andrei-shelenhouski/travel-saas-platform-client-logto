import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MAT_BUTTONS } from '@app/shared/material-imports';
import { MatIconModule } from '@angular/material/icon';

import type { OfferResponseDto } from '@app/shared/models';

const OFFER_STATUS_CLASS: Record<string, string> = {
  DRAFT: 'offer-status-draft',
  SENT: 'offer-status-sent',
  VIEWED: 'offer-status-viewed',
  ACCEPTED: 'offer-status-accepted',
  REJECTED: 'offer-status-rejected',
  EXPIRED: 'offer-status-expired',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail-offers-section',
  imports: [RouterLink, MatIconModule, ...MAT_BUTTONS],
  templateUrl: './lead-detail-offers-section.html',
  styleUrl: './lead-detail-offers-section.scss',
})
export class LeadDetailOffersSectionComponent {
  readonly offers = input<OfferResponseDto[]>([]);
  readonly canCreateOffer = input<boolean>(false);
  readonly requestId = input.required<string>();

  readonly createOfferClicked = output<string>();

  protected getOfferStatusClass(status: string | null | undefined): string {
    if (!status) {
      return 'offer-status-default';
    }

    return OFFER_STATUS_CLASS[status] ?? 'offer-status-default';
  }

  protected getOfferTooltip(offer: OfferResponseDto): string {
    const amount = offer.total;
    const currency = offer.currency;

    if (amount === null || amount === undefined) {
      return 'Итого не указано';
    }

    if (!currency) {
      return `Итого: ${amount}`;
    }

    return `Итого: ${amount} ${currency}`;
  }
}
