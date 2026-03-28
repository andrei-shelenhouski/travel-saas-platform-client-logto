import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

import { OffersService } from '@app/services/offers.service';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';
import type { OfferResponseDto } from '@app/shared/models';
import { OfferStatus } from '@app/shared/models';

type FilterTab = 'ALL' | OfferStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: OfferStatus.DRAFT, label: 'Draft' },
  { value: OfferStatus.SENT, label: 'Sent' },
  { value: OfferStatus.VIEWED, label: 'Viewed' },
  { value: OfferStatus.ACCEPTED, label: 'Accepted' },
  { value: OfferStatus.REJECTED, label: 'Rejected' },
  { value: OfferStatus.EXPIRED, label: 'Expired' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offers-list',
  imports: [RouterLink, ...MAT_BUTTONS, ...MAT_BUTTON_TOGGLES],
  templateUrl: './offers-list.html',
  styleUrl: './offers-list.css',
})
export class OffersListComponent {
  private readonly offersService = inject(OffersService);
  private readonly router = inject(Router);
  private readonly data = rxResource({
    stream: () => this.offersService.getList(),
  });

  readonly filterTabs = FILTER_TABS;
  readonly statusBadgeClass = STATUS_BADGE_CLASS;

  readonly offers = computed(() => this.data.value()?.data ?? []);
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load offers';
    }

    return undefined;
  });
  readonly activeFilter = signal<FilterTab>('ALL');

  readonly filteredOffers = computed(() => {
    const list = this.offers();
    const filter = this.activeFilter();

    if (filter === 'ALL') {
      return list;
    }

    return list.filter((o) => o.status === filter);
  });

  setFilter(value: FilterTab): void {
    this.activeFilter.set(value);
  }

  goToDetail(offer: OfferResponseDto): void {
    this.router.navigate(['/app/offers', offer.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  getStatusBadgeClass(status: string): string {
    return STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-500';
  }

  rowClass(offer: OfferResponseDto): string {
    const base = 'cursor-pointer hover:bg-gray-50 transition-colors';

    if (offer.status === OfferStatus.SENT || offer.status === OfferStatus.VIEWED) {
      return `${base} bg-blue-50/50`;
    }

    if (offer.status === OfferStatus.EXPIRED) {
      return `${base} bg-amber-50/50`;
    }

    return base;
  }
}
