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

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import { LeadsService } from '@app/services/leads.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import { LeadsListFilterBarComponent } from '../leads-list-filter-bar/leads-list-filter-bar';

import type {
  LeadResponseDto,
  LeadStatus,
  OrganizationMemberResponseDto,
} from '@app/shared/models';
const PAGE_SIZE = 20;
const LEADS_VIEW_STORAGE_KEY = 'leads_view';

type LeadStatusOption = {
  value: LeadStatus;
  label: string;
};

type AgentOption = {
  id: string;
  name: string;
};

const LEAD_STATUS_OPTIONS: LeadStatusOption[] = [
  { value: 'NEW', label: $localize`:@@leadStatusOptionNew:New` },
  { value: 'ASSIGNED', label: $localize`:@@leadStatusOptionAssigned:Assigned` },
  { value: 'IN_PROGRESS', label: $localize`:@@leadStatusOptionInProgress:In progress` },
  { value: 'OFFER_SENT', label: $localize`:@@leadStatusOptionOfferSent:Offer sent` },
  { value: 'WON', label: $localize`:@@leadStatusOptionWon:Won` },
  { value: 'LOST', label: $localize`:@@leadStatusOptionLost:Lost` },
  { value: 'EXPIRED', label: $localize`:@@leadStatusOptionExpired:Expired` },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: $localize`:@@leadClientTypeIndividual:Individual` },
  { value: 'COMPANY', label: $localize`:@@leadClientTypeCompany:Company` },
  { value: 'B2B_AGENT', label: $localize`:@@leadClientTypeB2BAgent:B2B agent` },
  { value: 'AGENT', label: $localize`:@@leadClientTypeAgent:Agent` },
];

const LEAD_STATUSES = new Set<LeadStatus>([
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'OFFER_SENT',
  'WON',
  'LOST',
  'EXPIRED',
]);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-leads-list',
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
    ClientTypeBadgeComponent,
    LeadsListFilterBarComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './leads-list.html',
  styleUrl: './leads-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class LeadsListComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissionService = inject(PermissionService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = PAGE_SIZE;

  readonly statusOptions = LEAD_STATUS_OPTIONS;
  readonly clientTypeOptions = CLIENT_TYPE_OPTIONS;

  readonly showAgentFilter = computed(() => !this.roleService.isAgent());

  readonly currentPage = signal(0);
  readonly statusFilter = signal<LeadStatus[]>([]);
  readonly selectedAgentId = signal('');
  readonly clientTypeFilter = signal('');
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
      clientType: this.clientTypeFilter(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      search: this.searchFilter(),
    }),
    stream: ({ params }) => {
      const { agentId, clientType, dateFrom, dateTo, page, search, status } = params;

      return this.leadsService.findAll({
        page: page + 1,
        limit: PAGE_SIZE,
        status: status.length > 0 ? status.join(',') : undefined,
        agentId: agentId || undefined,
        clientType: clientType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
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

  protected readonly displayedColumns: (keyof (LeadResponseDto & {
    dates: string;
    name: string;
  }))[] = [
    'number',
    'name',
    'clientType',
    'contactPhone',
    'contactEmail',
    'destination',
    'dates',
    'source',
    'status',
    'assignedAgentName',
    'createdAt',
    'updatedAt',
  ];

  constructor() {
    this.syncStateFromQueryParams();
    this.syncSearchDebounce();
    this.syncQueryParamsFromState();
    this.restoreSavedView();
  }

  onStatusFilterChange(statuses: LeadStatus[]): void {
    this.statusFilter.set(statuses ?? []);
    this.currentPage.set(0);
  }

  onAgentFilterChange(agentId: string): void {
    this.selectedAgentId.set(agentId ?? '');
    this.currentPage.set(0);
  }

  onClientTypeFilterChange(clientType: string): void {
    this.clientTypeFilter.set(clientType ?? '');
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
    localStorage.setItem(LEADS_VIEW_STORAGE_KEY, view);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  getTravelDatesLabel(lead: LeadResponseDto): string {
    const from = lead.departDateFrom;
    const to = lead.departDateTo;

    if (!from && !to) {
      return '—';
    }

    if (from && to) {
      return `${from} - ${to}`;
    }

    return from ?? to ?? '—';
  }

  navigateToLead(id: string): void {
    this.router.navigate(['/app/leads', id]);
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '0');
        const status = this.parseStatus(queryParams.get('status'));
        const agentId = queryParams.get('agentId') ?? '';
        const clientType = queryParams.get('clientType') ?? '';
        const dateFrom = queryParams.get('dateFrom') ?? '';
        const dateTo = queryParams.get('dateTo') ?? '';
        const search = queryParams.get('search') ?? '';

        this.currentPage.set(Number.isFinite(page) && page > 0 ? page : 0);
        this.statusFilter.set(status);
        this.selectedAgentId.set(agentId);
        this.clientTypeFilter.set(clientType);
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
      const clientType = this.clientTypeFilter();
      const dateFrom = this.dateFromFilter();
      const dateTo = this.dateToFilter();
      const search = this.searchFilter();
      const page = this.currentPage();

      const queryParams: Record<string, string | number | undefined> = {
        status: status.length > 0 ? status.join(',') : undefined,
        agentId: agentId || undefined,
        clientType: clientType || undefined,
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

      const preferred = localStorage.getItem(LEADS_VIEW_STORAGE_KEY) ?? 'table';

      if (preferred === 'kanban') {
        void this.router.navigate(['/app/leads/kanban'], { replaceUrl: true });
      }
    });
  }

  private parseStatus(status: string | null): LeadStatus[] {
    if (!status) {
      return [];
    }

    const statuses = status
      .split(',')
      .map((item) => item.trim() as LeadStatus)
      .filter((item) => LEAD_STATUSES.has(item));

    return Array.from(new Set(statuses));
  }

  private isSalesAgent(member: OrganizationMemberResponseDto): boolean {
    const role = member.role;

    return member.active && (role === 'AGENT' || role === 'SALES_AGENT' || role === 'ADMIN');
  }
}
