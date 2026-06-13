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
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { BookingsService } from '@app/services/bookings.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { createListState, PAGE_SIZE } from '@app/shared/utils/list-state';
import { BookingStatus } from '@app/shared/models';

import { BookingFilterBarComponent } from '../booking-filter-bar/booking-filter-bar';
import { BookingRow, BookingsTableComponent } from '../bookings-table/bookings-table.component';

import type { BookingResponseDto } from '@app/shared/models';
import type { BookingListFilterValue, StaffOption } from '../booking-filter-bar/booking-filter-bar';

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
    MatButtonModule,
    BookingFilterBarComponent,
    BookingsTableComponent,
    MatIcon,
    MatPaginatorModule,
    PageHeading,
    PageHeadingAction,
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
  private readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly listState = createListState();
  readonly currentPage = this.listState.currentPage;
  protected readonly pageSize = this.listState.pageSize;

  readonly statusFilter = signal<BookingStatus[]>([]);
  readonly assignedBackofficeId = signal('');
  readonly departDateFrom = signal('');
  readonly departDateTo = signal('');

  private readonly hydratedFromQueryParams = signal(false);
  private readonly applyingQueryParams = signal(false);

  private readonly membersData = rxResource({
    stream: () => this.membersService.findAll(),
  });

  protected readonly staffOptions = computed<StaffOption[]>(() => {
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
        limit: PAGE_SIZE,
        status: status.length > 0 ? status : undefined,
        assignedBackofficeId: assignedBackofficeId || undefined,
        departDateFrom: departDateFrom || undefined,
        departDateTo: departDateTo || undefined,
      });
    },
  });

  protected readonly filterValue = computed<BookingListFilterValue>(() => ({
    status: this.statusFilter(),
    assignedBackofficeId: this.assignedBackofficeId(),
    departDateFrom: this.departDateFrom(),
    departDateTo: this.departDateTo(),
  }));

  readonly showCreateBookingButton = computed(() => this.permissions.canUpdateBookings());

  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());

  protected readonly bookingRows = computed<BookingRow[]>(() =>
    (this.data.value()?.items ?? []).map((b) => this.toBookingRow(b)),
  );

  protected readonly omitColumns = ['dates', 'leadNumber', 'offerNumber', 'total', 'createdAt'];

  constructor() {
    this.syncStateFromQueryParams();
    this.syncQueryParamsFromState();
  }

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Не удалось загрузить бронирования';
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
    this.listState.onPageChange(event);
  }

  navigateToCreateBooking(): void {
    this.router.navigate(['/app/bookings/new']);
  }

  private toBookingRow(b: BookingResponseDto): BookingRow {
    return {
      id: b.id,
      number: b.number,
      clientName: this.resolveClientName(b),
      destination: b.destination,
      departDate: b.departDate,
      returnDate: b.returnDate,
      status: b.status,
      hasExpiringDocuments: this.resolveHasExpiringDocuments(b),
      expiringDocumentTooltip: this.resolveExpiringDocumentTooltip(b),
      isDirectEntry: this.resolveIsDirectEntry(b),
      assignedBackofficeName: b.assignedBackofficeName,
    };
  }

  private resolveClientName(b: BookingResponseDto): string {
    const snapshot = b.clientSnapshot;

    if (snapshot && typeof snapshot === 'object') {
      const candidates = [
        snapshot['companyName'],
        snapshot['fullName'],
        snapshot['name'],
        snapshot['clientName'],
      ];

      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
          return candidate;
        }
      }
    }

    return '—';
  }

  private resolveHasExpiringDocuments(b: BookingResponseDto): boolean {
    if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.COMPLETED) {
      return false;
    }

    return b.hasExpiringDocuments === true;
  }

  private resolveExpiringDocumentTooltip(b: BookingResponseDto): string {
    const firstHint = b.expiringDocuments?.[0];

    if (!firstHint) {
      return 'Документ истекает менее чем за 6 месяцев до возвращения';
    }

    const label = firstHint.documentLabel || 'Паспорт';
    const person = firstHint.personShortName || 'Турист';
    const expiryDate = firstHint.expiryDate || '—';

    return `${label} [${person}] истекает ${expiryDate} — менее 6 месяцев до возвращения`;
  }

  private resolveIsDirectEntry(b: BookingResponseDto): boolean {
    const source = b.source?.trim().toUpperCase();

    return source === 'DIRECT_ENTRY' || source === 'DIRECT';
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '1');
        const status = this.parseStatus(queryParams.get('status'));
        const assignedBackofficeId = queryParams.get('assignedBackofficeId') ?? '';
        const departDateFrom = queryParams.get('departDateFrom') ?? '';
        const departDateTo = queryParams.get('departDateTo') ?? '';

        this.currentPage.set(Number.isFinite(page) && page > 1 ? page - 1 : 0);
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
        page: page > 0 ? page + 1 : undefined,
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
