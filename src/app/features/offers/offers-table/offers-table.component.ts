import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';

import { OfferStatusChipComponent } from '@app/shared/components/offer-status-chip/offer-status-chip';

import type { OfferStatus } from '@app/shared/models';

export type OfferRow = {
  id: string;
  number?: string;
  destination?: string;
  leadNumber?: string;
  total?: number;
  currency?: string;
  status?: OfferStatus;
  createdAt?: string;
  updatedAt?: string;
};

type OfferColumn =
  | 'number'
  | 'destination'
  | 'leadNumber'
  | 'total'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

const ALL_COLUMNS: OfferColumn[] = [
  'number',
  'destination',
  'leadNumber',
  'total',
  'status',
  'createdAt',
  'updatedAt',
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offers-table',
  imports: [DatePipe, MatTableModule, OfferStatusChipComponent],
  templateUrl: './offers-table.component.html',
  styleUrl: './offers-table.component.scss',
  host: { class: 'table-wrap' },
})
export class OffersTableComponent {
  private readonly router = inject(Router);

  readonly offers = input<OfferRow[]>([]);
  readonly omitColumns = input<string[]>([]);

  protected readonly displayedColumns = computed<OfferColumn[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  protected navigateToOffer(id: string): void {
    void this.router.navigate(['/app/offers', id]);
  }
}
