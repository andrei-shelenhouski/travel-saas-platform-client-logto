import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { map } from 'rxjs/operators';

import { ClientsService } from '@app/services/clients.service';
import { OfferStatusChipComponent } from '@app/shared/components';

import type { OfferSummaryDto } from '@app/shared/models';

@Component({
  selector: 'app-offers-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatTableModule, OfferStatusChipComponent, MatButtonModule],
  templateUrl: './offers-history-section.html',
  styleUrl: './offers-history-section.scss',
})
export class OffersHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);

  private readonly offersData = rxResource<OfferSummaryDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getOffers(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly offers = computed(() => this.offersData.value() ?? []);
  readonly loading = computed(() => this.offersData.isLoading());

  readonly columns = [
    'offerNumber',
    'leadNumber',
    'destination',
    'total',
    'status',
    'createdAt',
  ] as const;

  formatDateShort(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  goToOffer(offer: OfferSummaryDto): void {
    this.router.navigate(['/app/offers', offer.id]);
  }
}
