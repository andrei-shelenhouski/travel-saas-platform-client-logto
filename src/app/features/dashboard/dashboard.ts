import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { DashboardService } from '@app/services/dashboard.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [RouterLink, ...MAT_BUTTONS, PageHeading],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  private readonly data = rxResource({
    stream: () => this.dashboardService.get(),
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

  readonly leadsByStatusEntries = computed(() => Object.entries(this.stats()?.leadsByStatus ?? {}));
  readonly stalledLeads = computed(() => this.stats()?.stalledLeads ?? []);
  readonly upcomingDepartures = computed(() => this.stats()?.upcomingDepartures ?? []);
}
