import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { calculateNights } from '@app/features/offers/offer-builder.utils';

import type { AccommodationDto } from '@app/shared/models';

const ALL_COLUMNS = ['hotel', 'roomType', 'mealPlan', 'dates', 'nights', 'price'] as const;

@Component({
  selector: 'app-offer-accommodations-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, MatTableModule],
  templateUrl: './offer-accommodations-table.html',
  styleUrl: './offer-accommodations-table.scss',
  host: { class: 'table-wrap' },
})
export class OfferAccommodationsTableComponent {
  readonly accommodations = input<AccommodationDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);
  readonly currency = input<string>('');

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  getNights(checkinDate?: string, checkoutDate?: string): number | string {
    if (!checkinDate || !checkoutDate) {
      return '-';
    }

    return calculateNights(checkinDate, checkoutDate);
  }
}
