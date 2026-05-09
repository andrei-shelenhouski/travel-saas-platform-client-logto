import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type AccommodationRow = {
  hotelName?: string;
  roomType?: string;
  mealPlan?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
};

function toRow(raw: Record<string, unknown>): AccommodationRow {
  const checkIn = typeof raw['checkIn'] === 'string' ? raw['checkIn'] : undefined;
  const checkOut = typeof raw['checkOut'] === 'string' ? raw['checkOut'] : undefined;
  const nights = typeof raw['nights'] === 'number' ? raw['nights'] : undefined;

  return {
    hotelName: typeof raw['hotelName'] === 'string' ? raw['hotelName'] : undefined,
    roomType: typeof raw['roomType'] === 'string' ? raw['roomType'] : undefined,
    mealPlan: typeof raw['mealPlan'] === 'string' ? raw['mealPlan'] : undefined,
    checkIn: checkIn,
    checkOut: checkOut,
    nights,
  };
}

@Component({
  selector: 'app-accommodation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './accommodation-table.html',
  styleUrl: './accommodation-table.scss',
})
export class AccommodationTableComponent {
  readonly accommodationDetails = input<Record<string, unknown>[] | null | undefined>(null);

  readonly rows = computed<AccommodationRow[]>(() => {
    const details = this.accommodationDetails();

    if (!details) {
      return [];
    }

    return details.map(toRow);
  });
}
