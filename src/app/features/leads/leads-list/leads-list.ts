import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import { LeadsService } from '@app/services/leads.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';

import type { LeadResponseDto } from '@app/shared/models';
const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-leads-list',
  imports: [
    ...MAT_BUTTON_TOGGLES,
    ...MAT_BUTTONS,
    DatePipe,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeading,
    RouterLink,
    ClientTypeBadgeComponent,
  ],
  templateUrl: './leads-list.html',
  styleUrl: './leads-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class LeadsListComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly pageSize = PAGE_SIZE;

  readonly currentPage = signal(0);

  private readonly data = rxResource({
    params: () => ({
      page: this.currentPage(),
    }),
    stream: ({ params }) => {
      const { page } = params;

      return this.leadsService.findAll({
        page: page + 1,
        limit: PAGE_SIZE,
      });
    },
  });

  readonly leads = computed(() => this.data.value()?.items ?? []);
  readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  readonly loading = computed(() => this.data.isLoading());

  private readonly redirectOnForbidden = effect(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse && err.status === 403) {
      void this.router.navigate(['/app/dashboard']);
    }
  });

  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return undefined;
      }

      return err.error?.message ?? err.message ?? 'Failed to load leads';
    }

    return undefined;
  });

  protected readonly displayedColumns: (keyof (LeadResponseDto & { name: string }))[] = [
    'number',
    'name',
    'clientType',
    'contactPhone',
    'contactEmail',
    'source',
    'status',
    'createdAt',
    'updatedAt',
  ];

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  navigateToLead(id: string): void {
    this.router.navigate([id], { relativeTo: this.activatedRoute });
  }
}
