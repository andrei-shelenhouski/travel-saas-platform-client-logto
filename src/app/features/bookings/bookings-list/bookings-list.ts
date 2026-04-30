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

import { BookingsService } from '@app/services/bookings.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { BookingStatus, OrgRole } from '@app/shared/models';

import { BookingFilterBarComponent } from '../booking-filter-bar/booking-filter-bar';

import type { BookingResponseDto } from '@app/shared/models';
import type { BookingListFilterValue, StaffOption } from '../booking-filter-bar/booking-filter-bar';

const PAGE_SIZE = 20;

const BOOKING_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING_CONFIRMATION,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
]);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bookings-list',
  imports: [
    ...MAT_BUTTONS,
    BookingFilterBarComponent,
    BookingStatusChipComponent,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeading,
  ],
  templateUrl: './bookings-list.html',
  styleUrl: './bookings-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class BookingsListComponent {
  private readonly bookingsService = inject(BookingsService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = PAGE_SIZE;

  readonly currentPage = signal(0);
  readonly statusFilter = signal<BookingStatus[]>([]);
  readonly assignedBackofficeId = signal('');
  readonly departDateFrom = signal('');
  readonly departDateTo = signal('');

  private readonly hydratedFromQueryParams = signal(false);
  private readonly applyingQueryParams = signal(false);

  private readonly membersData = rxResource({
    stream: () => this.membersService.findAll(),
  });

  readonly staffOptions = computed<StaffOption[]>(() => {
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
      assignedBackofficeId: this.assignedBackofficeId(),
      departDateFrom: this.departDateFrom(),
      departDateTo: this.departDateTo(),
    }),
    stream: ({ params }) => {
      const { assignedBackofficeId, departDateFrom, departDateTo, page, status } = params;

      return this.bookingsService.getList({
        page: page + 1,
        size: PAGE_SIZE,
        status: status.length > 0 ? status : undefined,
        assignedBackofficeId: assignedBackofficeId || undefined,
        departDateFrom: departDateFrom || undefined,
        departDateTo: departDateTo || undefined,
      });
    },
  });

  readonly filterValue = computed<BookingListFilterValue>(() => ({
    status: this.statusFilter(),
    assignedBackofficeId: this.assignedBackofficeId(),
    departDateFrom: this.departDateFrom(),
    departDateTo: this.departDateTo(),
  }));

  readonly showCreateBookingButton = computed(() => {
    const role = this.roleService.roleOrDefault();
    const rawRole = this.roleService.rawRole();

    return role === 'Admin' || role === 'Manager' || rawRole === OrgRole.BACK_OFFICE;
  });

  readonly bookings = computed(() => this.data.value()?.items ?? []);
  readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  readonly loading = computed(() => this.data.isLoading());

  protected readonly displayedColumns: (keyof (BookingResponseDto & { actions: string }))[] = [
    'number',
    'clientId',
    'destination',
    'departDate',
    'returnDate',
    'status',
    'assignedBackofficeName',
    'actions',
  ];

  constructor() {
    this.syncStateFromQueryParams();
    this.syncQueryParamsFromState();
  }

  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load bookings';
    }

    return undefined;
  });

  onFilterChange(value: BookingListFilterValue): void {
    this.statusFilter.set(value.status);
    this.assignedBackofficeId.set(value.assignedBackofficeId);
    this.departDateFrom.set(value.departDateFrom);
    this.departDateTo.set(value.departDateTo);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  navigateToBooking(id: string): void {
    this.router.navigate(['/bookings', id]);
  }

  navigateToCreateBooking(): void {
    this.router.navigate(['/app/offers']);
  }

  onRowKeydown(event: KeyboardEvent, id: string): void {
    const key = event.key;

    if (key !== 'Enter' && key !== ' ') {
      return;
    }

    event.preventDefault();
    this.navigateToBooking(id);
  }

  getClientName(booking: BookingResponseDto): string {
    const snapshot = booking.clientSnapshot;

    if (snapshot && typeof snapshot === 'object') {
      const map = snapshot as Record<string, unknown>;
      const candidates = [map['fullName'], map['companyName'], map['name'], map['clientName']];

      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
          return candidate;
        }
      }
    }

    return '—';
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '0');
        const status = this.parseStatus(queryParams.get('status'));
        const assignedBackofficeId = queryParams.get('assignedBackofficeId') ?? '';
        const departDateFrom = queryParams.get('departDateFrom') ?? '';
        const departDateTo = queryParams.get('departDateTo') ?? '';

        this.currentPage.set(Number.isFinite(page) && page >= 0 ? page : 0);
        this.statusFilter.set(status);
        this.assignedBackofficeId.set(assignedBackofficeId);
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
      const assignedBackofficeId = this.assignedBackofficeId();
      const departDateFrom = this.departDateFrom();
      const departDateTo = this.departDateTo();

      const queryParams: Record<string, string | number | undefined> = {
        page: page > 0 ? page : undefined,
        status: status.length > 0 ? status.join(',') : undefined,
        assignedBackofficeId: assignedBackofficeId || undefined,
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

  private parseStatus(status: string | null): BookingStatus[] {
    if (!status) {
      return [];
    }

    const statuses = status
      .split(',')
      .map((item) => item.trim() as BookingStatus)
      .filter((item) => BOOKING_STATUSES.has(item));

    return Array.from(new Set(statuses));
  }
}
