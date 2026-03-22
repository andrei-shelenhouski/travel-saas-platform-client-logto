import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

import { BookingsService } from '@app/services/bookings.service';
import type { BookingResponseDto } from '@app/shared/models';
import { BookingStatus } from '@app/shared/models';

type FilterTab = 'ALL' | BookingStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: BookingStatus.PENDING, label: 'Pending' },
  { value: BookingStatus.CONFIRMED, label: 'Confirmed' },
  { value: BookingStatus.PAID, label: 'Paid' },
  { value: BookingStatus.CANCELLED, label: 'Cancelled' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bookings-list',
  imports: [],
  templateUrl: './bookings-list.html',
  styleUrl: './bookings-list.css',
})
export class BookingsListComponent {
  private readonly bookingsService = inject(BookingsService);
  private readonly router = inject(Router);

  readonly activeFilter = signal<FilterTab>('ALL');
  private readonly data = rxResource({
    params: () => ({ status: this.activeFilter() === 'ALL' ? undefined : this.activeFilter() }),
    stream: ({ params }) =>
      this.bookingsService.getList({
        page: 1,
        limit: 50,
        status: params.status as BookingStatus | undefined,
      }),
  });

  readonly filterTabs = FILTER_TABS;
  readonly statusBadgeClass = STATUS_BADGE_CLASS;
  readonly bookings = computed(() => this.data.value()?.data ?? []);
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load bookings';
    }
    return undefined;
  });

  setFilter(value: FilterTab): void {
    this.activeFilter.set(value);
  }

  goToDetail(booking: BookingResponseDto): void {
    this.router.navigate(['/app/bookings', booking.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  getStatusBadgeClass(status: string): string {
    return STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-500';
  }
}
