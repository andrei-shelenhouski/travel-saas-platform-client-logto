import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';

import type { PersonBookingItemDto } from '@app/shared/models';

const ALL_COLUMNS = ['number', 'destination', 'travelPeriod', 'travelerRole', 'status'] as const;

@Component({
  selector: 'app-person-bookings-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatTableModule, BookingStatusChipComponent],
  templateUrl: './person-bookings-table.html',
  styleUrl: './person-bookings-table.scss',
  host: { class: 'table-wrap' },
})
export class PersonBookingsTableComponent {
  readonly rows = input<PersonBookingItemDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);

  readonly rowClick = output<string>();

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleDateString('ru-RU');
  }
}
