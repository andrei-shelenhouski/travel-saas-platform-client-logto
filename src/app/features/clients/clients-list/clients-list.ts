import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';

import { ClientsService } from '@app/services/clients.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';

import { ClientFilterBarComponent, ClientFilterValue } from './client-filter-bar/client-filter-bar';
import { ClientTypeBadgeComponent } from './client-type-badge/client-type-badge';

import type { ClientResponseDto } from '@app/shared/models';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-clients-list',
  imports: [
    RouterLink,
    ...MAT_BUTTONS,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ClientFilterBarComponent,
    ClientTypeBadgeComponent,
    MatIcon,
  ],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss',
})
export class ClientsListComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);

  readonly pageSize = PAGE_SIZE;

  readonly activeFilter = signal<ClientFilterValue>({ type: 'ALL', search: '' });
  readonly currentPage = signal(0);

  private readonly data = rxResource({
    params: () => ({
      filter: this.activeFilter(),
      page: this.currentPage(),
    }),
    stream: ({ params }) => {
      const { filter, page } = params;

      return this.clientsService.getList({
        type: filter.type === 'ALL' ? undefined : (filter.type as ClientType),
        search: filter.search || undefined,
        page: page + 1,
        limit: PAGE_SIZE,
      });
    },
  });

  readonly clients = computed(() => this.data.value()?.items ?? []);
  readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        this.router.navigate(['/app/dashboard']);

        return undefined;
      }

      return err.error?.message ?? err.message ?? 'Failed to load clients';
    }

    return undefined;
  });

  protected readonly displayedColumns: (keyof (ClientResponseDto & { name: string }))[] = [
    'name',
    'type',
    'phone',
    'email',
    'createdAt',
    'updatedAt',
  ];

  onFilterChange(value: ClientFilterValue): void {
    this.activeFilter.set(value);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  goToDetail(client: ClientResponseDto): void {
    this.router.navigate(['/app/clients', client.id]);
  }

  displayName(client: ClientResponseDto): string {
    if (client.type === ClientType.INDIVIDUAL) {
      return client.fullName ?? '—';
    }

    return client.companyName ?? client.fullName ?? '—';
  }

  displaySubtitle(client: ClientResponseDto): string | null {
    if (client.type === ClientType.COMPANY || client.type === ClientType.B2B_AGENT) {
      return client.fullName ?? null;
    }

    return null;
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }
}
