import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
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
import { FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  DeleteLeadDialogComponent,
  DeleteLeadDialogResult,
} from '@app/features/leads/delete-lead-dialog/delete-lead-dialog';
import { LeadSourceBadgeComponent } from '@app/features/leads/lead-source-badge/lead-source-badge';
import { LeadsListFilterBarComponent } from '@app/features/leads/leads-list-filter-bar/leads-list-filter-bar';
import { LeadsService } from '@app/services/leads.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import {
  CLIENT_TYPE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  LeadSource,
  LeadStatus,
} from '@app/shared/models';

import type { LeadResponseDto, LeadStatus as LeadStatusType } from '@app/shared/models';
import type { OrganizationMemberResponseDto } from '@app/shared/models';

type AgentOption = {
  id: string;
  name: string;
};

type SourceOption = {
  value: LeadSource | string;
  label: string;
};

type KanbanColumnConfig = {
  status: LeadStatusType;
  label: string;
  color: string;
};

const LEADS_VIEW_STORAGE_KEY = 'leads_view';
const KANBAN_FETCH_LIMIT = 100;

const LEAD_SOURCE_OPTIONS: SourceOption[] = [
  { value: 'MANUAL', label: 'Вручную' },
  { value: 'INSTAGRAM_ADS', label: 'Instagram Ads' },
  { value: 'TOURVISOR', label: 'TourVisor' },
];

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { status: LeadStatus.NEW, label: 'Новый', color: '#2b9db8' },
  {
    status: LeadStatus.ASSIGNED,
    label: 'Назначен',
    color: '#784d90',
  },
  {
    status: LeadStatus.IN_PROGRESS,
    label: 'В работе',
    color: '#d97706',
  },
  {
    status: LeadStatus.OFFER_SENT,
    label: 'Отправлено КП',
    color: '#41636e',
  },
  { status: LeadStatus.WON, label: 'Выигран', color: '#16a34a' },
  { status: LeadStatus.LOST, label: 'Проигран', color: '#73787a' },
  {
    status: LeadStatus.EXPIRED,
    label: 'Истёк',
    color: '#ba1a1a',
  },
];

const TERMINAL_STATUSES = new Set<LeadStatusType>([
  LeadStatus.WON,
  LeadStatus.LOST,
  LeadStatus.EXPIRED,
]);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-leads-kanban',
  imports: [
    DragDropModule,
    DatePipe,
    RouterLink,
    LeadsListFilterBarComponent,
    LeadSourceBadgeComponent,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatDividerModule,
    PageHeading,
  ],
  templateUrl: './leads-kanban.html',
  styleUrl: './leads-kanban.scss',
})
export class LeadsKanbanComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissionService = inject(PermissionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly statusOptions = LEAD_STATUS_OPTIONS;
  readonly clientTypeOptions = CLIENT_TYPE_OPTIONS;
  readonly sourceOptions = LEAD_SOURCE_OPTIONS;
  readonly statusFilter = signal<LeadStatusType[]>([]);
  readonly selectedAgentId = signal('');
  readonly clientTypeFilter = signal('');
  readonly sourceFilter = signal('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly searchFilter = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusFilterWarning = signal(false);

  readonly itemsByStatus = signal<Record<LeadStatusType, LeadResponseDto[]>>({
    NEW: [],
    ASSIGNED: [],
    IN_PROGRESS: [],
    OFFER_SENT: [],
    WON: [],
    LOST: [],
    EXPIRED: [],
    CONVERTED: [],
  });

  readonly showAgentFilter = computed(() => this.permissionService.canViewAllLeads());
  readonly canCreateLead = computed(() => this.permissionService.canCreateLead());
  readonly canDeleteLead = computed(() => this.permissionService.canDeleteLead());

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
      .sort((left, right) => left.name.localeCompare(right.name, 'ru'));
  });

  private readonly effectiveAgentId = computed(() => {
    if (this.showAgentFilter()) {
      return this.selectedAgentId();
    }

    return this.permissionService.currentUserId() ?? '';
  });

  private readonly data = rxResource({
    params: () => ({
      agentId: this.effectiveAgentId(),
      clientType: this.clientTypeFilter(),
      source: this.sourceFilter(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      search: this.searchFilter(),
    }),
    stream: ({ params }) => {
      const { agentId, clientType, dateFrom, dateTo, search, source } = params;

      return this.leadsService.getList({
        page: 1,
        limit: KANBAN_FETCH_LIMIT,
        agentId: agentId || undefined,
        clientType: clientType || undefined,
        source: source || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
      });
    },
  });

  readonly loading = computed(() => this.data.isLoading());
  readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  readonly showTruncatedBanner = computed(() => this.totalElements() > KANBAN_FETCH_LIMIT);
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Не удалось загрузить лиды';
    }

    return undefined;
  });

  readonly columns = computed(() => {
    const byStatus = this.itemsByStatus();

    return KANBAN_COLUMNS.map((column) => ({
      ...column,
      items: byStatus[column.status] ?? [],
    }));
  });

  readonly allListIds = computed(() => KANBAN_COLUMNS.map((column) => column.status));

  constructor() {
    this.syncSearchDebounce();

    effect(() => {
      const value = this.data.value();

      if (!value?.items) {
        return;
      }

      const byStatus: Record<LeadStatusType, LeadResponseDto[]> = {
        NEW: [],
        ASSIGNED: [],
        IN_PROGRESS: [],
        OFFER_SENT: [],
        WON: [],
        LOST: [],
        EXPIRED: [],
        CONVERTED: [],
      };

      for (const lead of value.items) {
        const status = lead.status as LeadStatusType;

        if (!byStatus[status]) {
          continue;
        }

        byStatus[status].push(lead);
      }

      this.itemsByStatus.set(byStatus);
    });
  }

  onStatusFilterChange(statuses: LeadStatusType[]): void {
    this.statusFilter.set(statuses ?? []);
    this.statusFilterWarning.set((statuses?.length ?? 0) > 0);
  }

  onAgentFilterChange(agentId: string): void {
    this.selectedAgentId.set(agentId ?? '');
  }

  onClientTypeFilterChange(clientType: string): void {
    this.clientTypeFilter.set(clientType ?? '');
  }

  onSourceFilterChange(source: string): void {
    this.sourceFilter.set(source ?? '');
  }

  onDateFromChange(value: string): void {
    this.dateFromFilter.set(value);
  }

  onDateToChange(value: string): void {
    this.dateToFilter.set(value);
  }

  isDropDisabled(status: LeadStatusType): boolean {
    return TERMINAL_STATUSES.has(status);
  }

  isDragDisabled(status: LeadStatusType | string): boolean {
    return TERMINAL_STATUSES.has(status as LeadStatusType);
  }

  getAgentInitials(name: string | null): string {
    if (!name) {
      return 'NA';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return 'NA';
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  onDrop(event: CdkDragDrop<LeadResponseDto[]>, targetStatus: LeadStatusType): void {
    if (this.isDropDisabled(targetStatus)) {
      return;
    }

    if (event.previousContainer === event.container) {
      return;
    }

    const prevList = event.previousContainer.data;
    const currList = event.container.data;
    const lead = event.item.data as LeadResponseDto;
    const previousStatus = lead.status as LeadStatusType;

    if (previousStatus === targetStatus) {
      return;
    }

    transferArrayItem(prevList, currList, event.previousIndex, event.currentIndex);
    lead.status = targetStatus;
    this.itemsByStatus.update((map) => ({ ...map }));

    this.leadsService.updateStatus(lead.id, { status: targetStatus }).subscribe({
      next: (updated) => {
        const idx = currList.findIndex((current) => current.id === updated.id);

        if (idx !== -1) {
          currList[idx] = updated;
        }

        this.itemsByStatus.update((map) => ({ ...map }));
      },
      error: (err: unknown) => {
        transferArrayItem(currList, prevList, event.currentIndex, event.previousIndex);
        lead.status = previousStatus;
        this.itemsByStatus.update((map) => ({ ...map }));
        this.snackBar.open(this.getDropErrorMessage(err), 'Close', { duration: 5000 });
      },
    });
  }

  goToLead(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
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

  setPreferredView(view: 'table' | 'kanban'): void {
    localStorage.setItem(LEADS_VIEW_STORAGE_KEY, view);
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
      });
  }

  private getDropErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 400) {
        return 'Недопустимый переход статуса';
      }

      if (err.status === 403) {
        return 'Нет прав для изменения статуса';
      }

      if (typeof err.error?.message === 'string') {
        return err.error.message;
      }

      return err.message || 'Недопустимый переход статуса';
    }

    if (typeof err === 'object' && err !== null && 'message' in err) {
      const message = (err as { message?: string }).message;

      if (message) {
        return message;
      }
    }

    return 'Недопустимый переход статуса';
  }

  private isSalesAgent(member: OrganizationMemberResponseDto): boolean {
    const role = member.role;

    return member.active && (role === 'AGENT' || role === 'SALES_AGENT' || role === 'ADMIN');
  }

  protected readonly skeletonRows = [1, 2, 3];
}
