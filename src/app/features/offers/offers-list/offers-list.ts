import { DatePipe } from '@angular/common';
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
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import { OffersListFilterBarComponent } from '../offers-list-filter-bar/offers-list-filter-bar';

import type {
  OfferResponseDto,
  OfferStatus,
  OrganizationMemberResponseDto,
} from '@app/shared/models';

const PAGE_SIZE = 20;
const OFFERS_VIEW_STORAGE_KEY = 'offers_view';

type OfferStatusOption = {
  value: OfferStatus;
  label: string;
};

type AgentOption = {
  id: string;
  name: string;
};

const OFFER_STATUS_OPTIONS: OfferStatusOption[] = [
  { value: 'DRAFT', label: $localize`:@@offerStatusOptionDraft:Draft` },
  { value: 'SENT', label: $localize`:@@offerStatusOptionSent:Sent` },
  { value: 'VIEWED', label: $localize`:@@offerStatusOptionViewed:Viewed` },
  { value: 'ACCEPTED', label: $localize`:@@offerStatusOptionAccepted:Accepted` },
  { value: 'REJECTED', label: $localize`:@@offerStatusOptionRejected:Rejected` },
  { value: 'EXPIRED', label: $localize`:@@offerStatusOptionExpired:Expired` },
];

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
    ...MAT_BUTTON_TOGGLES,
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
    DatePipe,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeading,
    ReactiveFormsModule,
    RouterLink,
    OffersListFilterBarComponent,
    StatusBadgeComponent,
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
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = PAGE_SIZE;

  readonly statusOptions = OFFER_STATUS_OPTIONS;

  readonly showAgentFilter = computed(() => !this.roleService.isAgent());

  readonly currentPage = signal(0);
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

  readonly agentOptions = computed<AgentOption[]>(() => {
    const members = this.membersData.value() ?? [];

    return members
      .filter((member) => this.isSalesAgent(member))
      .map((member) => ({
        id: member.userId,
        name: member.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  });

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

  readonly offers = computed(() => this.data.value()?.items ?? []);
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

      return err.error?.message ?? err.message ?? 'Failed to load offers';
    }

    return undefined;
  });

  protected readonly displayedColumns: (keyof OfferResponseDto)[] = [
    'number',
    'destination',
    'total',
    'status',
    'createdAt',
    'updatedAt',
  ];

  constructor() {
    this.syncStateFromQueryParams();
    this.syncSearchDebounce();
    this.syncQueryParamsFromState();
    this.restoreSavedView();
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
    this.currentPage.set(event.pageIndex);
  }

  navigateToOffer(id: string): void {
    this.router.navigate(['/app/offers', id]);
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '0');
        const status = this.parseStatus(queryParams.get('status'));
        const agentId = queryParams.get('agentId') ?? '';
        const dateFrom = queryParams.get('dateFrom') ?? '';
        const dateTo = queryParams.get('dateTo') ?? '';
        const search = queryParams.get('search') ?? '';

        this.currentPage.set(Number.isFinite(page) && page > 0 ? page : 0);
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
        page: page > 0 ? page : undefined,
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

  private isSalesAgent(member: OrganizationMemberResponseDto): boolean {
    const role = member.role;

    return member.active && (role === 'AGENT' || role === 'SALES_AGENT' || role === 'ADMIN');
  }
}
