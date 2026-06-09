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
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ClientsService } from '@app/services/clients.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { ClientType } from '@app/shared/models';

import {
  ClientFilterBarComponent,
  ClientFilterValue,
} from '../client-filter-bar/client-filter-bar';
import { ClientsTableComponent } from '../clients-table/clients-table.component';

export const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-clients-list',
  imports: [
    MatButtonModule,
    ClientFilterBarComponent,
    ClientsTableComponent,
    MatIcon,
    MatPaginatorModule,
    PageHeading,
    PageHeadingAction,
  ],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class ClientsListComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);

  protected readonly pageSize = PAGE_SIZE;

  protected readonly activeFilter = signal<ClientFilterValue>({ type: 'ALL', search: '' });
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

  protected readonly clients = computed(() => this.data.value()?.items ?? []);
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  private readonly redirectOnForbidden = effect(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse && err.status === 403) {
      void this.router.navigate(['/app/dashboard']);
    }
  });

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return undefined;
      }

      return err.error?.message ?? err.message ?? 'Не удалось загрузить клиентов';
    }

    return undefined;
  });

  onFilterChange(value: ClientFilterValue): void {
    this.activeFilter.set(value);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  navigateToCreateClient(): void {
    void this.router.navigate(['/app/clients/new']);
  }
}
