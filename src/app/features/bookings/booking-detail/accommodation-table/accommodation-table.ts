import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { calculateNights } from '@app/features/offers/offer-builder.utils';

import type { BookingAccommodationDto } from '@app/shared/models';

@Component({
  selector: 'app-accommodation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './accommodation-table.html',
  styleUrl: './accommodation-table.scss',
})
export class AccommodationTableComponent {
  readonly accommodationDetails = input<BookingAccommodationDto[] | null | undefined>(null);

  readonly rows = computed<BookingAccommodationDto[]>(() => {
    const details = this.accommodationDetails();

    if (!details) {
      return [];
    }

    return details.map((detail) => {
      if (detail.nights !== undefined && detail.nights !== null) {
        return detail;
      }

      if (!detail.checkinDate || !detail.checkoutDate) {
        return detail;
      }

      return {
        ...detail,
        nights: calculateNights(detail.checkinDate, detail.checkoutDate),
      };
    });
  });
}
