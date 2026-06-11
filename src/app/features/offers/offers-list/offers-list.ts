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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { computeAgentOptions } from '@app/shared/utils/agent-options.util';
import { createListState, PAGE_SIZE } from '@app/shared/utils/list-state';

import { OffersListFilterBarComponent } from '../offers-list-filter-bar/offers-list-filter-bar';
import { OffersTableComponent } from '../offers-table/offers-table.component';

import { OFFER_STATUS_OPTIONS } from '@app/shared/models';

import type { OfferStatus } from '@app/shared/models';

const OFFERS_VIEW_STORAGE_KEY = 'offers_view';

const OFFER_STATUSES = new Set<OfferStatus>([
  'DRAFT',
  'SENT',
  'VIEWED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
]);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offers-list',
  imports: [
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    PageHeading,
    ReactiveFormsModule,
    RouterLink,
    OffersListFilterBarComponent,
    OffersTableComponent,
  ],
  templateUrl: './offers-list.html',
  styleUrl: './offers-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class OffersListComponent {
  private readonly offersService = inject(OffersService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusOptions = OFFER_STATUS_OPTIONS;

  protected readonly showAgentFilter = computed(() => this.permissionService.canViewAllOffers());
  protected readonly canCreateOffer = computed(() => this.permissionService.canCreateOffer());

  private readonly listState = createListState();
  readonly currentPage = this.listState.currentPage;
  protected readonly pageSize = this.listState.pageSize;

  readonly statusFilter = signal<OfferStatus[]>([]);
  readonly selectedAgentId = signal('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly searchFilter = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly hydratedFromQueryParams = signal(false);
  private readonly applyingQueryParams = signal(false);

  private readonly membersData = rxResource({
    stream: () => this.membersService.findAll(),
  });

  protected readonly agentOptions = computeAgentOptions(
    computed(() => this.membersData.value() ?? []),
  );

  private readonly effectiveAgentId = computed(() => {
    if (this.showAgentFilter()) {
      return this.selectedAgentId();
    }

    return this.permissionService.currentUserId() ?? '';
  });

  private readonly data = rxResource({
    params: () => ({
      page: this.currentPage(),
      status: this.statusFilter(),
      agentId: this.effectiveAgentId(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      search: this.searchFilter(),
    }),
    stream: ({ params }) => {
      const { agentId, page, status, dateFrom, dateTo, search } = params;

      return this.offersService.getList({
        page: page + 1,
        limit: PAGE_SIZE,
        status: status.length > 0 ? status : undefined,
        agentId: agentId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
      });
    },
  });

  protected readonly offerRows = computed(() =>
    (this.data.value()?.items ?? []).map((o) => ({
      id: o.id,
      number: o.number,
      destination: o.destination,
      total: o.total,
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    })),
  );
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return undefined;
      }

      return err.error?.message ?? err.message ?? 'Не удалось загрузить предложения';
    }

    return undefined;
  });

  constructor() {
    this.syncStateFromQueryParams();
    this.syncSearchDebounce();
    this.syncQueryParamsFromState();
    this.restoreSavedView();

    effect(() => {
      const err = this.data.error();

      if (err instanceof HttpErrorResponse && err.status === 403) {
        void this.router.navigate(['/app/dashboard']);
      }
    });
  }

  onStatusFilterChange(statuses: OfferStatus[]): void {
    this.statusFilter.set(statuses ?? []);
    this.currentPage.set(0);
  }

  onAgentFilterChange(agentId: string): void {
    this.selectedAgentId.set(agentId ?? '');
    this.currentPage.set(0);
  }

  onDateFromChange(value: string): void {
    this.dateFromFilter.set(value);
    this.currentPage.set(0);
  }

  onDateToChange(value: string): void {
    this.dateToFilter.set(value);
    this.currentPage.set(0);
  }

  setPreferredView(view: 'table' | 'kanban'): void {
    localStorage.setItem(OFFERS_VIEW_STORAGE_KEY, view);
  }

  onPageChange(event: PageEvent): void {
    this.listState.onPageChange(event);
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '1');
        const status = this.parseStatus(queryParams.get('status'));
        const agentId = queryParams.get('agentId') ?? '';
        const dateFrom = queryParams.get('dateFrom') ?? '';
        const dateTo = queryParams.get('dateTo') ?? '';
        const search = queryParams.get('search') ?? '';

        this.currentPage.set(Number.isFinite(page) && page > 1 ? page - 1 : 0);
        this.statusFilter.set(status);
        this.selectedAgentId.set(agentId);
        this.dateFromFilter.set(dateFrom);
        this.dateToFilter.set(dateTo);
        this.searchFilter.set(search);
        this.searchControl.setValue(search, { emitEvent: false });

        this.hydratedFromQueryParams.set(true);
        this.applyingQueryParams.set(false);
      });
  }

  private syncSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((searchValue) => {
        const value = searchValue.trim();

        if (value === this.searchFilter()) {
          return;
        }

        this.searchFilter.set(value);
        this.currentPage.set(0);
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

      const status = this.statusFilter();
      const agentId = this.effectiveAgentId();
      const dateFrom = this.dateFromFilter();
      const dateTo = this.dateToFilter();
      const search = this.searchFilter();
      const page = this.currentPage();

      const queryParams: Record<string, string | number | undefined> = {
        status: status.length > 0 ? status.join(',') : undefined,
        agentId: agentId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        page: page > 0 ? page + 1 : undefined,
      };

      void this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams,
        replaceUrl: true,
      });
    });
  }

  private restoreSavedView(): void {
    effect(() => {
      if (!this.hydratedFromQueryParams()) {
        return;
      }

      const preferred = localStorage.getItem(OFFERS_VIEW_STORAGE_KEY) ?? 'table';

      if (preferred === 'kanban') {
        void this.router.navigate(['/app/offers/kanban'], { replaceUrl: true });
      }
    });
  }

  private parseStatus(status: string | null): OfferStatus[] {
    if (!status) {
      return [];
    }

    const statuses = status
      .split(',')
      .map((item) => item.trim() as OfferStatus)
      .filter((item) => OFFER_STATUSES.has(item));

    return Array.from(new Set(statuses));
  }
}
