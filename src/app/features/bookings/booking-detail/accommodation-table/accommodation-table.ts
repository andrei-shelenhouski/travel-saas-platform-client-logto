import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

    return details;
  });
}
