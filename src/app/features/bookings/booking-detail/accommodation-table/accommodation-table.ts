import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';

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
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <h2 class="text-sm font-semibold text-gray-900">Проживание</h2>

      <div class="mt-3 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="px-2 py-2 font-medium">Отель</th>
              <th class="px-2 py-2 font-medium">Номер</th>
              <th class="px-2 py-2 font-medium">Питание</th>
              <th class="px-2 py-2 font-medium">Заезд</th>
              <th class="px-2 py-2 font-medium">Выезд</th>
              <th class="px-2 py-2 font-medium text-right">Ночей</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              <tr class="border-b border-gray-100 last:border-none">
                <td class="px-2 py-2">{{ row.hotelName || '—' }}</td>
                <td class="px-2 py-2">{{ row.roomType || '—' }}</td>
                <td class="px-2 py-2">{{ row.mealPlan || '—' }}</td>
                <td class="px-2 py-2">
                  {{ row.checkinDate ? (row.checkinDate | date: 'mediumDate') : '—' }}
                </td>
                <td class="px-2 py-2">
                  {{ row.checkoutDate ? (row.checkoutDate | date: 'mediumDate') : '—' }}
                </td>
                <td class="px-2 py-2 text-right">{{ row.nights ?? '—' }}</td>
              </tr>
            } @empty {
              <tr>
                <td class="px-2 py-3 text-gray-500" colspan="6">Нет данных о проживании</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
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
