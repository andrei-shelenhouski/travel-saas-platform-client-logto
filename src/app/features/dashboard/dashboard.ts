import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { forkJoin } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { LeadsService } from '@app/services/leads.service';
import { OffersService } from '@app/services/offers.service';
import { RequestsService } from '@app/services/requests.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [RouterLink, ...MAT_BUTTONS],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly requestsService = inject(RequestsService);
  private readonly offersService = inject(OffersService);
  private readonly bookingsService = inject(BookingsService);

  private readonly data = rxResource({
    stream: () =>
      forkJoin({
        leads: this.leadsService.getStatistics(),
        requests: this.requestsService.getStatistics(),
        offers: this.offersService.getStatistics(),
        bookings: this.bookingsService.getStatistics(),
      }),
  });

  readonly stats = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load dashboard';
    }

    return undefined;
  });

  readonly totalLeads = computed(() => sumValues(this.stats()?.leads));
  readonly totalRequests = computed(() => sumValues(this.stats()?.requests));
  readonly totalOffers = computed(() => sumValues(this.stats()?.offers));
  readonly totalBookings = computed(() => sumValues(this.stats()?.bookings));

  /** Expose for template: status keys for breakdown. */
  objectKeys(rec: Record<string, number> | undefined): string[] {
    return rec ? Object.keys(rec) : [];
  }
}

function sumValues(rec: Record<string, number> | undefined): number {
  if (!rec) {
    return 0;
  }

  return Object.values(rec).reduce((a, b) => a + b, 0);
}
