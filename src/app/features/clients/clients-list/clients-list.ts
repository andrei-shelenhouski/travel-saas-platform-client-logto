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
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';

import { take } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';

import { CreateClientComponent } from '../create-client/create-client';
import { ClientFilterBarComponent, ClientFilterValue } from './client-filter-bar/client-filter-bar';
import { ClientTypeBadgeComponent } from './client-type-badge/client-type-badge';

import type { ClientResponseDto, CreateClientDto } from '@app/shared/models';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-clients-list',
  imports: [
    ...MAT_BUTTONS,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ClientFilterBarComponent,
    ClientTypeBadgeComponent,
    MatIcon,
    DatePipe,
  ],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss',
})
export class ClientsListComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

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

  // TODO: extract to a pipe
  displayName(client: ClientResponseDto): string {
    if (client.type === ClientType.INDIVIDUAL) {
      return client.fullName ?? '—';
    }

    return client.companyName ?? client.fullName ?? '—';
  }

  // TODO: extract to a pipe
  displaySubtitle(client: ClientResponseDto): string | null {
    if (client.type === ClientType.COMPANY || client.type === ClientType.B2B_AGENT) {
      return client.fullName ?? null;
    }

    return null;
  }

  navigateToClient(id: string): void {
    this.router.navigate([id], { relativeTo: this.activatedRoute });
  }

  addClient(): void {
    const dialog = this.dialog.open<CreateClientComponent>(CreateClientComponent, {
      width: '600px',
    });

    dialog
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result) {
          this.sendAddClientRequest(result);
        }
      });
  }

  private sendAddClientRequest(dto: CreateClientDto): void {
    this.clientsService.create(dto).subscribe({
      next: (created) => {
        this.snackBar.open('Client created', 'Close', { duration: 3000 });
        this.router.navigate([created.id], { relativeTo: this.activatedRoute });
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message ?? err.message ?? 'Failed to create client',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }
}
