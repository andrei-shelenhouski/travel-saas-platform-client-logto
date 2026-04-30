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
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';

import { debounceTime, distinctUntilChanged } from 'rxjs';

import { LeadsListFilterBarComponent } from '@app/features/leads/leads-list-filter-bar/leads-list-filter-bar';
import { LeadsService } from '@app/services/leads.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';
import { LeadStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type { LeadResponseDto, LeadStatus as LeadStatusType } from '@app/shared/models';
import type { OrganizationMemberResponseDto } from '@app/shared/models';

type LeadStatusOption = {
  value: LeadStatusType;
  label: string;
};

type AgentOption = {
  id: string;
  name: string;
};

type ClientTypeOption = {
  value: string;
  label: string;
};

type KanbanColumnConfig = {
  status: LeadStatusType;
  label: string;
  color: string;
};

const LEADS_VIEW_STORAGE_KEY = 'leads_view';
const KANBAN_FETCH_LIMIT = 100;

const LEAD_STATUS_OPTIONS: LeadStatusOption[] = [
  { value: LeadStatus.NEW, label: $localize`:@@leadStatusOptionNew:New` },
  { value: LeadStatus.ASSIGNED, label: $localize`:@@leadStatusOptionAssigned:Assigned` },
  { value: LeadStatus.IN_PROGRESS, label: $localize`:@@leadStatusOptionInProgress:In progress` },
  { value: LeadStatus.OFFER_SENT, label: $localize`:@@leadStatusOptionOfferSent:Offer sent` },
  { value: LeadStatus.WON, label: $localize`:@@leadStatusOptionWon:Won` },
  { value: LeadStatus.LOST, label: $localize`:@@leadStatusOptionLost:Lost` },
  { value: LeadStatus.EXPIRED, label: $localize`:@@leadStatusOptionExpired:Expired` },
];

const CLIENT_TYPE_OPTIONS: ClientTypeOption[] = [
  { value: 'INDIVIDUAL', label: $localize`:@@leadClientTypeIndividual:Individual` },
  { value: 'COMPANY', label: $localize`:@@leadClientTypeCompany:Company` },
  { value: 'B2B_AGENT', label: $localize`:@@leadClientTypeB2BAgent:B2B agent` },
  { value: 'AGENT', label: $localize`:@@leadClientTypeAgent:Agent` },
];

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { status: LeadStatus.NEW, label: $localize`:@@leadStatusKanbanNew:New`, color: '#2b9db8' },
  {
    status: LeadStatus.ASSIGNED,
    label: $localize`:@@leadStatusKanbanAssigned:Assigned`,
    color: '#784d90',
  },
  {
    status: LeadStatus.IN_PROGRESS,
    label: $localize`:@@leadStatusKanbanInProgress:In progress`,
    color: '#d97706',
  },
  {
    status: LeadStatus.OFFER_SENT,
    label: $localize`:@@leadStatusKanbanOfferSent:Offer sent`,
    color: '#41636e',
  },
  { status: LeadStatus.WON, label: $localize`:@@leadStatusKanbanWon:Won`, color: '#16a34a' },
  { status: LeadStatus.LOST, label: $localize`:@@leadStatusKanbanLost:Lost`, color: '#73787a' },
  {
    status: LeadStatus.EXPIRED,
    label: $localize`:@@leadStatusKanbanExpired:Expired`,
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
    MatIconModule,
    ...MAT_BUTTONS,
    ...MAT_BUTTON_TOGGLES,
    PageHeading,
  ],
  templateUrl: './leads-kanban.html',
  styleUrl: './leads-kanban.scss',
})
export class LeadsKanbanComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissionService = inject(PermissionService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions = LEAD_STATUS_OPTIONS;
  readonly clientTypeOptions = CLIENT_TYPE_OPTIONS;
  readonly statusFilter = signal<LeadStatusType[]>([]);
  readonly selectedAgentId = signal('');
  readonly clientTypeFilter = signal('');
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
  });

  readonly showAgentFilter = computed(() => !this.roleService.isAgent());

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
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      search: this.searchFilter(),
    }),
    stream: ({ params }) => {
      const { agentId, clientType, dateFrom, dateTo, search } = params;

      return this.leadsService.findAll({
        page: 1,
        limit: KANBAN_FETCH_LIMIT,
        agentId: agentId || undefined,
        clientType: clientType || undefined,
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
      return err.error?.message ?? err.message ?? 'Failed to load leads';
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
        this.toast.showError(this.getDropErrorMessage(err));
      },
    });
  }

  goToLead(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
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
        return $localize`:@@leadKanbanInvalidTransitionError:Invalid status transition`;
      }

      if (err.status === 403) {
        return $localize`:@@leadKanbanForbiddenTransitionError:No permission to change status`;
      }

      if (typeof err.error?.message === 'string') {
        return err.error.message;
      }

      return (
        err.message || $localize`:@@leadKanbanDefaultTransitionError:Invalid status transition`
      );
    }

    if (typeof err === 'object' && err !== null && 'message' in err) {
      const message = (err as { message?: string }).message;

      if (message) {
        return message;
      }
    }

    return $localize`:@@leadKanbanDefaultTransitionError:Invalid status transition`;
  }

  private isSalesAgent(member: OrganizationMemberResponseDto): boolean {
    const role = member.role;

    return member.active && (role === 'AGENT' || role === 'SALES_AGENT' || role === 'ADMIN');
  }

  protected readonly skeletonRows = [1, 2, 3];
}
