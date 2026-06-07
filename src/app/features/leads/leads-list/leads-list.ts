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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import {
  DeleteLeadDialogComponent,
  DeleteLeadDialogResult,
} from '@app/features/leads/delete-lead-dialog/delete-lead-dialog';
import { LeadSourceBadgeComponent } from '@app/features/leads/lead-source-badge/lead-source-badge';
import { LeadsService } from '@app/services/leads.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';
import { CLIENT_TYPE_OPTIONS, LEAD_STATUS_OPTIONS } from '@app/shared/models';
import { computeAgentOptions } from '@app/shared/utils/agent-options.util';
import { createListState, PAGE_SIZE } from '@app/shared/utils/list-state';

import { LeadsListFilterBarComponent } from '../leads-list-filter-bar/leads-list-filter-bar';

import type { LeadResponseDto, LeadStatus } from '@app/shared/models';

const LEADS_VIEW_STORAGE_KEY = 'leads_view';

type SourceOption = {
  value: string;
  label: string;
};

const LEAD_SOURCE_OPTIONS: SourceOption[] = [
  { value: 'MANUAL', label: 'Вручную' },
  { value: 'INSTAGRAM_ADS', label: 'Instagram Ads' },
  { value: 'TOURVISOR', label: 'TourVisor' },
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
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    DatePipe,
    MatChipsModule,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    PageHeading,
    PageHeadingAction,
    ReactiveFormsModule,
    RouterLink,
    ClientTypeBadgeComponent,
    LeadSourceBadgeComponent,
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
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  protected readonly statusOptions = LEAD_STATUS_OPTIONS;
  protected readonly clientTypeOptions = CLIENT_TYPE_OPTIONS;
  protected readonly sourceOptions = LEAD_SOURCE_OPTIONS;

  protected readonly showAgentFilter = computed(() => this.permissionService.canViewAllLeads());
  protected readonly canCreateLead = computed(() => this.permissionService.canCreateLead());
  protected readonly canDeleteLead = computed(() => this.permissionService.canDeleteLead());

  private readonly listState = createListState();
  readonly currentPage = this.listState.currentPage;
  protected readonly pageSize = this.listState.pageSize;

  readonly statusFilter = signal<LeadStatus[]>([]);
  readonly selectedAgentId = signal('');
  readonly clientTypeFilter = signal('');
  readonly sourceFilter = signal('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly searchFilter = signal('');
  readonly includeDeleted = signal(false);
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
      clientType: this.clientTypeFilter(),
      source: this.sourceFilter(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      search: this.searchFilter(),
      includeDeleted: this.includeDeleted(),
    }),
    stream: ({ params }) => {
      const {
        agentId,
        clientType,
        dateFrom,
        dateTo,
        includeDeleted,
        page,
        search,
        source,
        status,
      } = params;

      return this.leadsService.getList({
        page: page + 1,
        limit: PAGE_SIZE,
        status: status.length > 0 ? status : undefined,
        agentId: agentId || undefined,
        clientType: clientType || undefined,
        source: source || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        includeDeleted: includeDeleted || undefined,
      });
    },
  });

  protected readonly leads = computed(() => this.data.value()?.items ?? []);
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return undefined;
      }

      return err.error?.message ?? err.message ?? 'Не удалось загрузить лиды';
    }

    return undefined;
  });

  protected readonly displayedColumns = computed<string[]>(() => {
    const base: string[] = [
      'number',
      'status',
      'source',
      'name',
      'clientType',
      'contactPhone',
      'contactEmail',
      'destination',
      'dates',
      'assignedAgentName',
      'createdAt',
      'updatedAt',
    ];

    if (this.canDeleteLead()) {
      base.push('actions');
    }

    return base;
  });

  constructor() {
    effect(() => {
      const err = this.data.error();

      if (err instanceof HttpErrorResponse && err.status === 403) {
        void this.router.navigate(['/app/dashboard']);
      }
    });
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

  onSourceFilterChange(source: string): void {
    this.sourceFilter.set(source ?? '');
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
    this.listState.onPageChange(event);
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

  protected isDeletedLead(lead: LeadResponseDto): boolean {
    return Boolean(lead.deletedAt);
  }

  protected toggleIncludeDeleted(): void {
    this.includeDeleted.update((v) => !v);
    this.currentPage.set(0);
  }

  protected openDeleteDialog(event: Event, lead: LeadResponseDto): void {
    event.stopPropagation();

    const hasOffers = (lead.offers ?? []).length > 0;

    const dialogRef = this.dialog.open(DeleteLeadDialogComponent, {
      width: '480px',
      data: {
        leadId: lead.id,
        leadNumber: lead.number,
        hasOffers,
      },
    });

    dialogRef.afterClosed().subscribe((result: DeleteLeadDialogResult | undefined) => {
      if (result?.deleted) {
        this.data.reload();
      }
    });
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '1');
        const status = this.parseStatus(queryParams.get('status'));
        const agentId = queryParams.get('agentId') ?? '';
        const clientType = queryParams.get('clientType') ?? '';
        const source = queryParams.get('source') ?? '';
        const dateFrom = queryParams.get('dateFrom') ?? '';
        const dateTo = queryParams.get('dateTo') ?? '';
        const search = queryParams.get('search') ?? '';
        const includeDeleted = queryParams.get('includeDeleted') === 'true';

        this.currentPage.set(Number.isFinite(page) && page > 1 ? page - 1 : 0);
        this.statusFilter.set(status);
        this.selectedAgentId.set(agentId);
        this.clientTypeFilter.set(clientType);
        this.sourceFilter.set(source);
        this.dateFromFilter.set(dateFrom);
        this.dateToFilter.set(dateTo);
        this.searchFilter.set(search);
        this.includeDeleted.set(includeDeleted);
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
      const source = this.sourceFilter();
      const dateFrom = this.dateFromFilter();
      const dateTo = this.dateToFilter();
      const search = this.searchFilter();
      const includeDeleted = this.includeDeleted();
      const page = this.currentPage();

      const queryParams: Record<string, string | number | undefined> = {
        status: status.length > 0 ? status.join(',') : undefined,
        agentId: agentId || undefined,
        clientType: clientType || undefined,
        source: source || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        includeDeleted: includeDeleted ? 'true' : undefined,
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
}
