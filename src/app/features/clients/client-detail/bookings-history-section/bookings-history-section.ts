import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { map } from 'rxjs/operators';

import { ClientsService } from '@app/services/clients.service';
import { BookingStatusChipComponent } from '@app/shared/components';
import { MAT_BUTTONS } from '@app/shared/material-imports';

import type { BookingSummaryDto } from '@app/shared/models';

@Component({
  selector: 'app-bookings-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatTableModule, BookingStatusChipComponent, ...MAT_BUTTONS],
  templateUrl: './bookings-history-section.html',
  styleUrl: './bookings-history-section.scss',
})
export class BookingsHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);

  private readonly bookingsData = rxResource<BookingSummaryDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getBookings(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly bookings = computed(() => this.bookingsData.value() ?? []);
  readonly loading = computed(() => this.bookingsData.isLoading());

  readonly columns = [
    'bookingNumber',
    'leadNumber',
    'offerNumber',
    'destination',
    'dates',
    'status',
    'total',
    'createdAt',
  ] as const;

  formatDateShort(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  goToBooking(booking: BookingSummaryDto): void {
    this.router.navigate(['/app/bookings', booking.id]);
  }
}
