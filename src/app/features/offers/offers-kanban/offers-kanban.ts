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

import { OffersListFilterBarComponent } from '@app/features/offers/offers-list-filter-bar/offers-list-filter-bar';
import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';
import { OfferStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type { OfferResponseDto, OfferStatus as OfferStatusType } from '@app/shared/models';
import type { OrganizationMemberResponseDto } from '@app/shared/models';

type OfferStatusOption = {
  value: OfferStatusType;
  label: string;
};

type AgentOption = {
  id: string;
  name: string;
};

type KanbanColumnConfig = {
  status: OfferStatusType;
  label: string;
  color: string;
};

const OFFERS_VIEW_STORAGE_KEY = 'offers_view';
const KANBAN_FETCH_LIMIT = 100;

const OFFER_STATUS_OPTIONS: OfferStatusOption[] = [
  { value: OfferStatus.DRAFT, label: $localize`:@@offerStatusOptionDraft:Draft` },
  { value: OfferStatus.SENT, label: $localize`:@@offerStatusOptionSent:Sent` },
  { value: OfferStatus.VIEWED, label: $localize`:@@offerStatusOptionViewed:Viewed` },
  { value: OfferStatus.ACCEPTED, label: $localize`:@@offerStatusOptionAccepted:Accepted` },
  { value: OfferStatus.REJECTED, label: $localize`:@@offerStatusOptionRejected:Rejected` },
  { value: OfferStatus.EXPIRED, label: $localize`:@@offerStatusOptionExpired:Expired` },
];

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    status: OfferStatus.DRAFT,
    label: $localize`:@@offerStatusKanbanDraft:Draft`,
    color: '#6b7280',
  },
  {
    status: OfferStatus.SENT,
    label: $localize`:@@offerStatusKanbanSent:Sent`,
    color: '#2563eb',
  },
  {
    status: OfferStatus.VIEWED,
    label: $localize`:@@offerStatusKanbanViewed:Viewed`,
    color: '#7c3aed',
  },
  {
    status: OfferStatus.ACCEPTED,
    label: $localize`:@@offerStatusKanbanAccepted:Accepted`,
    color: '#16a34a',
  },
  {
    status: OfferStatus.REJECTED,
    label: $localize`:@@offerStatusKanbanRejected:Rejected`,
    color: '#dc2626',
  },
  {
    status: OfferStatus.EXPIRED,
    label: $localize`:@@offerStatusKanbanExpired:Expired`,
    color: '#9ca3af',
  },
];

const TERMINAL_STATUSES = new Set<OfferStatusType>([
  OfferStatus.ACCEPTED,
  OfferStatus.REJECTED,
  OfferStatus.EXPIRED,
]);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offers-kanban',
  imports: [
    DragDropModule,
    DatePipe,
    RouterLink,
    OffersListFilterBarComponent,
    MatIconModule,
    ...MAT_BUTTONS,
    ...MAT_BUTTON_TOGGLES,
    PageHeading,
  ],
  templateUrl: './offers-kanban.html',
  styleUrl: './offers-kanban.scss',
})
export class OffersKanbanComponent {
  private readonly offersService = inject(OffersService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissionService = inject(PermissionService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions = OFFER_STATUS_OPTIONS;
  readonly statusFilter = signal<OfferStatusType[]>([]);
  readonly selectedAgentId = signal('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly searchFilter = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusFilterWarning = signal(false);

  readonly itemsByStatus = signal<Record<OfferStatusType, OfferResponseDto[]>>({
    DRAFT: [],
    SENT: [],
    VIEWED: [],
    ACCEPTED: [],
    REJECTED: [],
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
      status: this.statusFilter(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      search: this.searchFilter(),
    }),
    stream: ({ params }) => {
      const { agentId, status, dateFrom, dateTo, search } = params;

      return this.offersService.getList({
        page: 1,
        limit: KANBAN_FETCH_LIMIT,
        agentId: agentId || undefined,
        status: status.length > 0 ? status : undefined,
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
      return err.error?.message ?? err.message ?? 'Failed to load offers';
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

  readonly skeletonRows = [1, 2, 3];

  constructor() {
    this.syncSearchDebounce();

    effect(() => {
      const value = this.data.value();

      if (!value?.items) {
        return;
      }

      const byStatus: Record<OfferStatusType, OfferResponseDto[]> = {
        DRAFT: [],
        SENT: [],
        VIEWED: [],
        ACCEPTED: [],
        REJECTED: [],
        EXPIRED: [],
      };

      for (const offer of value.items) {
        const status = offer.status as OfferStatusType;

        if (!byStatus[status]) {
          continue;
        }

        byStatus[status].push(offer);
      }

      this.itemsByStatus.set(byStatus);
    });
  }

  onStatusFilterChange(statuses: OfferStatusType[]): void {
    this.statusFilter.set(statuses ?? []);
    this.statusFilterWarning.set((statuses?.length ?? 0) > 0);
  }

  onAgentFilterChange(agentId: string): void {
    this.selectedAgentId.set(agentId ?? '');
  }

  onDateFromChange(value: string): void {
    this.dateFromFilter.set(value);
  }

  onDateToChange(value: string): void {
    this.dateToFilter.set(value);
  }

  isDropDisabled(status: OfferStatusType): boolean {
    return TERMINAL_STATUSES.has(status);
  }

  isDragDisabled(status: OfferStatusType | string): boolean {
    return TERMINAL_STATUSES.has(status as OfferStatusType);
  }

  onDrop(event: CdkDragDrop<OfferResponseDto[]>, targetStatus: OfferStatusType): void {
    if (this.isDropDisabled(targetStatus)) {
      return;
    }

    if (event.previousContainer === event.container) {
      return;
    }

    const prevList = event.previousContainer.data;
    const currList = event.container.data;
    const offer = event.item.data as OfferResponseDto;
    const previousStatus = offer.status as OfferStatusType;

    if (previousStatus === targetStatus) {
      return;
    }

    transferArrayItem(prevList, currList, event.previousIndex, event.currentIndex);
    offer.status = targetStatus;
    this.itemsByStatus.update((map) => ({ ...map }));

    this.offersService.setStatus(offer.id, targetStatus).subscribe({
      next: (updated) => {
        const idx = currList.findIndex((current) => current.id === updated.id);

        if (idx !== -1) {
          currList[idx] = updated;
        }

        this.itemsByStatus.update((map) => ({ ...map }));
      },
      error: (err: unknown) => {
        transferArrayItem(currList, prevList, event.currentIndex, event.previousIndex);
        offer.status = previousStatus;
        this.itemsByStatus.update((map) => ({ ...map }));
        this.toast.showError(this.getDropErrorMessage(err));
      },
    });
  }

  goToOffer(offer: OfferResponseDto): void {
    this.router.navigate(['/app/offers', offer.id]);
  }

  setPreferredView(view: 'table' | 'kanban'): void {
    localStorage.setItem(OFFERS_VIEW_STORAGE_KEY, view);
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
        return $localize`:@@offerKanbanInvalidTransitionError:Invalid status transition`;
      }

      if (err.status === 403) {
        return $localize`:@@offerKanbanForbiddenTransitionError:No permission to change status`;
      }

      if (typeof err.error?.message === 'string') {
        return err.error.message;
      }

      return (
        err.message || $localize`:@@offerKanbanDefaultTransitionError:Invalid status transition`
      );
    }

    if (typeof err === 'object' && err !== null && 'message' in err) {
      const message = (err as { message?: string }).message;

      if (message) {
        return message;
      }
    }

    return $localize`:@@offerKanbanDefaultTransitionError:Invalid status transition`;
  }

  private isSalesAgent(member: OrganizationMemberResponseDto): boolean {
    const role = member.role;

    return member.active && (role === 'AGENT' || role === 'SALES_AGENT' || role === 'ADMIN');
  }

  protected readonly OfferStatus = OfferStatus;
}
