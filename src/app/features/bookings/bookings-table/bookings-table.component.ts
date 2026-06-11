import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';

import type { BookingStatus } from '@app/shared/models';

export type BookingRow = {
  id: string;
  number?: string;
  clientName?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  leadNumber?: string;
  offerNumber?: string;
  totalPrice?: number;
  currency?: string;
  status?: BookingStatus;
  hasExpiringDocuments?: boolean;
  expiringDocumentTooltip?: string;
  isDirectEntry?: boolean;
  assignedBackofficeName?: string;
  createdAt?: string;
};

type BookingColumn =
  | 'number'
  | 'client'
  | 'destination'
  | 'departDate'
  | 'returnDate'
  | 'dates'
  | 'leadNumber'
  | 'offerNumber'
  | 'total'
  | 'status'
  | 'expiringDocuments'
  | 'source'
  | 'assignedBackoffice'
  | 'createdAt';

const ALL_COLUMNS: BookingColumn[] = [
  'number',
  'client',
  'destination',
  'departDate',
  'returnDate',
  'dates',
  'leadNumber',
  'offerNumber',
  'total',
  'status',
  'expiringDocuments',
  'source',
  'assignedBackoffice',
  'createdAt',
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bookings-table',
  imports: [
    DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink,
    BookingStatusChipComponent,
  ],
  templateUrl: './bookings-table.component.html',
  styleUrl: './bookings-table.component.scss',
  host: { class: 'table-wrap' },
})
export class BookingsTableComponent {
  private readonly router = inject(Router);

  readonly bookings = input<BookingRow[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input(false);

  protected readonly displayedColumns = computed<BookingColumn[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  protected navigateToBooking(id: string): void {
    void this.router.navigate(['/app/bookings', id]);
  }

  protected onRowKeydown(event: KeyboardEvent, id: string): void {
    const key = event.key;

    if (key !== 'Enter' && key !== ' ') {
      return;
    }

    event.preventDefault();
    this.navigateToBooking(id);
  }
}
