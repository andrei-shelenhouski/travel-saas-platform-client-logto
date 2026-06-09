import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { map } from 'rxjs/operators';

import { ClientsService } from '@app/services/clients.service';
import {
  BookingRow,
  BookingsTableComponent,
} from '@app/features/bookings/bookings-table/bookings-table.component';

import type { BookingSummaryDto } from '@app/shared/models';

@Component({
  selector: 'app-bookings-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, BookingsTableComponent],
  templateUrl: './bookings-history-section.html',
  styleUrl: './bookings-history-section.scss',
})
export class BookingsHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly clientsService = inject(ClientsService);

  private readonly bookingsData = rxResource<BookingSummaryDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getBookings(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly loading = computed(() => this.bookingsData.isLoading());

  readonly bookingRows = computed<BookingRow[]>(() =>
    (this.bookingsData.value() ?? []).map((b) => this.toBookingRow(b)),
  );

  readonly omitColumns = [
    'client',
    'departDate',
    'returnDate',
    'expiringDocuments',
    'source',
    'assignedBackoffice',
  ];

  private toBookingRow(b: BookingSummaryDto): BookingRow {
    return {
      id: b.id,
      number: b.bookingNumber,
      destination: b.destination,
      departDate: b.departDate,
      returnDate: b.returnDate,
      leadNumber: b.leadNumber,
      offerNumber: b.offerNumber,
      totalPrice: b.totalPrice,
      currency: b.currency,
      status: b.status,
      createdAt: b.createdAt,
    };
  }
}
