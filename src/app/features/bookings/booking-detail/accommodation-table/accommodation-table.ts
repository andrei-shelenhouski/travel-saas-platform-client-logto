import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type AccommodationRow = {
  hotelName?: string;
  roomType?: string;
  mealPlan?: string;
  checkinDate?: string;
  checkoutDate?: string;
  nights?: number;
};

function toRow(raw: Record<string, unknown>): AccommodationRow {
  const checkin = typeof raw['checkinDate'] === 'string' ? raw['checkinDate'] : undefined;
  const checkout = typeof raw['checkoutDate'] === 'string' ? raw['checkoutDate'] : undefined;
  let nights: number | undefined;

  if (checkin && checkout) {
    const diff = new Date(checkout).getTime() - new Date(checkin).getTime();
    nights = Math.round(diff / 86_400_000);
  }

  return {
    hotelName: typeof raw['hotelName'] === 'string' ? raw['hotelName'] : undefined,
    roomType: typeof raw['roomType'] === 'string' ? raw['roomType'] : undefined,
    mealPlan: typeof raw['mealPlan'] === 'string' ? raw['mealPlan'] : undefined,
    checkinDate: checkin,
    checkoutDate: checkout,
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
