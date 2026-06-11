import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { OffersTableComponent } from '@app/features/offers/offers-table/offers-table.component';

import type { OfferResponseDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail-offers-section',
  imports: [MatIconModule, MatButtonModule, OffersTableComponent],
  templateUrl: './lead-detail-offers-section.html',
  styleUrl: './lead-detail-offers-section.scss',
})
export class LeadDetailOffersSectionComponent {
  readonly offers = input<OfferResponseDto[]>([]);
  readonly canCreateOffer = input<boolean>(false);

  readonly createOfferClicked = output<void>();

  readonly offerRows = computed(() =>
    this.offers().map((o) => ({
      id: o.id,
      number: o.number,
      destination: o.destination,
      total: o.total,
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
  );
}
