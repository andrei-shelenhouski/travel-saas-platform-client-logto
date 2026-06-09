import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { map } from 'rxjs/operators';

import { ClientsService } from '@app/services/clients.service';
import { OffersTableComponent } from '@app/features/offers/offers-table/offers-table.component';

import type { OfferSummaryDto } from '@app/shared/models';

@Component({
  selector: 'app-offers-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, OffersTableComponent],
  templateUrl: './offers-history-section.html',
  styleUrl: './offers-history-section.scss',
})
export class OffersHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly clientsService = inject(ClientsService);

  private readonly offersData = rxResource<OfferSummaryDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getOffers(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly offerRows = computed(() =>
    (this.offersData.value() ?? []).map((o) => ({
      id: o.id,
      number: o.offerNumber,
      destination: o.destination,
      leadNumber: o.leadNumber,
      total: o.totalPrice,
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt,
    })),
  );
  readonly loading = computed(() => this.offersData.isLoading());
}
