import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { RequestStatusChipComponent } from '@app/shared/components/request-status-chip/request-status-chip';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { RequestStatus } from '@app/shared/models';

import { RequestFilterBarComponent } from '../request-filter-bar/request-filter-bar';

import type { RequestResponseDto } from '@app/shared/models';
import type {
  ManagerOption,
  RequestListFilterValue,
} from '../request-filter-bar/request-filter-bar';

const PAGE_SIZE = 20;

const REQUEST_STATUSES = new Set<RequestStatus>([
  RequestStatus.OPEN,
  RequestStatus.QUOTED,
  RequestStatus.CLOSED,
]);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-requests-list',
  imports: [
    ...MAT_BUTTONS,
    RequestFilterBarComponent,
    RequestStatusChipComponent,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeading,
  ],
  templateUrl: './requests-list.html',
  styleUrl: './requests-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class RequestsListComponent {
  private readonly requestsService = inject(RequestsService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = PAGE_SIZE;

  readonly currentPage = signal(0);
  readonly statusFilter = signal<RequestStatus[]>([]);
  readonly managerId = signal('');
  readonly departDateFrom = signal('');
  readonly departDateTo = signal('');

  private readonly hydratedFromQueryParams = signal(false);
  private readonly applyingQueryParams = signal(false);

  private readonly membersData = rxResource({
    stream: () => this.membersService.findAll(),
  });

  readonly managerOptions = computed<ManagerOption[]>(() => {
    const members = this.membersData.value() ?? [];

    return members
      .filter((member) => member.active)
      .map((member) => ({ id: member.userId, name: member.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  });

  private readonly data = rxResource({
    params: () => ({
      page: this.currentPage(),
      status: this.statusFilter(),
      managerId: this.managerId(),
      departDateFrom: this.departDateFrom(),
      departDateTo: this.departDateTo(),
    }),
    stream: ({ params }) => {
      const { managerId, page } = params;

      return this.requestsService.getList({
        page: page + 1,
        limit: PAGE_SIZE,
        managerId: managerId || undefined,
      });
    },
  });

  readonly filterValue = computed<RequestListFilterValue>(() => ({
    status: this.statusFilter(),
    managerId: this.managerId(),
    departDateFrom: this.departDateFrom(),
    departDateTo: this.departDateTo(),
  }));

  readonly requests = computed(() => {
    let list = this.data.value()?.items ?? [];

    if (this.permissions.filterToOwnRecords()) {
      const uid = this.permissions.currentUserId();

      if (uid) {
        list = list.filter((r) => r.managerId === uid);
      }
    }

    const statusFilterValue = this.statusFilter();
    const departDateFromValue = this.departDateFrom();
    const departDateToValue = this.departDateTo();

    if (statusFilterValue.length > 0) {
      list = list.filter((r) => statusFilterValue.includes(r.status as RequestStatus));
    }

    if (departDateFromValue) {
      list = list.filter((r) => !r.departDate || r.departDate >= departDateFromValue);
    }

    if (departDateToValue) {
      list = list.filter((r) => !r.departDate || r.departDate <= departDateToValue);
    }

    return list;
  });

  readonly totalElements = computed(() => this.requests().length);
  readonly loading = computed(() => this.data.isLoading());

  protected readonly displayedColumns: (keyof (RequestResponseDto & { actions: string }))[] = [
    'destination',
    'departDate',
    'returnDate',
    'adults',
    'status',
    'managerName',
    'createdAt',
  ];

  constructor() {
    this.syncStateFromQueryParams();
    this.syncQueryParamsFromState();
  }

  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load requests';
    }

    return undefined;
  });

  onFilterChange(value: RequestListFilterValue): void {
    this.statusFilter.set(value.status);
    this.managerId.set(value.managerId);
    this.departDateFrom.set(value.departDateFrom);
    this.departDateTo.set(value.departDateTo);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  navigateToRequest(id: string): void {
    this.router.navigate(['/app/requests', id]);
  }

  navigateToCreateRequest(): void {
    this.router.navigate(['/app/requests/new']);
  }

  onRowKeydown(event: KeyboardEvent, id: string): void {
    const key = event.key;

    if (key !== 'Enter' && key !== ' ') {
      return;
    }

    event.preventDefault();
    this.navigateToRequest(id);
  }

  formatDate(iso: string | null): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '0');
        const status = this.parseStatus(queryParams.get('status'));
        const managerId = queryParams.get('managerId') ?? '';
        const departDateFrom = queryParams.get('departDateFrom') ?? '';
        const departDateTo = queryParams.get('departDateTo') ?? '';

        this.currentPage.set(Number.isFinite(page) && page >= 0 ? page : 0);
        this.statusFilter.set(status);
        this.managerId.set(managerId);
        this.departDateFrom.set(departDateFrom);
        this.departDateTo.set(departDateTo);

        this.hydratedFromQueryParams.set(true);
        this.applyingQueryParams.set(false);
      });
  }

  private syncQueryParamsFromState(): void {
    effect(() => {
      if (!this.hydratedFromQueryParams()) {
        return;
      }

      if (this.applyingQueryParams()) {
        return;
      }

      const page = this.currentPage();
      const status = this.statusFilter();
      const managerId = this.managerId();
      const departDateFrom = this.departDateFrom();
      const departDateTo = this.departDateTo();

      const queryParams: Record<string, string | number | undefined> = {
        page: page > 0 ? page : undefined,
        status: status.length > 0 ? status.join(',') : undefined,
        managerId: managerId || undefined,
        departDateFrom: departDateFrom || undefined,
        departDateTo: departDateTo || undefined,
      };

      void this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams,
        replaceUrl: true,
      });
    });
  }

  private parseStatus(status: string | null): RequestStatus[] {
    if (!status) {
      return [];
    }

    const statuses = status
      .split(',')
      .map((item) => item.trim() as RequestStatus)
      .filter((item) => REQUEST_STATUSES.has(item));

    return Array.from(new Set(statuses));
  }
}
