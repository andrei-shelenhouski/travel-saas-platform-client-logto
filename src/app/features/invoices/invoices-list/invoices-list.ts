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
import { InvoicesService } from '@app/services/invoices.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { ClientType, InvoiceStatus } from '@app/shared/models';

import { InvoiceFilterBarComponent } from '../invoice-filter-bar/invoice-filter-bar';
import { InvoiceStatusChipComponent } from '../invoice-status-chip/invoice-status-chip';
import { InvoiceSummaryCardsComponent } from '../invoice-summary-cards/invoice-summary-cards';

import type { InvoiceResponseDto, InvoiceSummaryResponseDto } from '@app/shared/models';

const PAGE_SIZE = 20;
const INVOICE_STATUSES = new Set<InvoiceStatus>(Object.values(InvoiceStatus));
const CLIENT_TYPES = new Set<ClientType>(Object.values(ClientType));

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoices-list',
  imports: [
    ...MAT_BUTTONS,
    ...MAT_ICONS,
    ClientTypeBadgeComponent,
    InvoiceFilterBarComponent,
    InvoiceStatusChipComponent,
    InvoiceSummaryCardsComponent,
    MatIcon,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PageHeading,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './invoices-list.html',
  styleUrl: './invoices-list.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class InvoicesListComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly canCreateInvoice = computed(() => this.permissions.canCreateInvoice());

  protected readonly currentPage = signal(0);
  protected readonly statusFilter = signal<InvoiceStatus[]>([]);
  protected readonly clientTypeFilter = signal('');
  protected readonly dateFromFilter = signal('');
  protected readonly dateToFilter = signal('');
  protected readonly currencyFilter = signal('');
  protected readonly searchFilter = signal('');
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly hydratedFromQueryParams = signal(false);
  private readonly applyingQueryParams = signal(false);

  private readonly data = rxResource({
    params: () => ({
      page: this.currentPage(),
      status: this.statusFilter(),
      clientType: this.clientTypeFilter(),
      dateFrom: this.dateFromFilter(),
      dateTo: this.dateToFilter(),
      currency: this.currencyFilter(),
      search: this.searchFilter(),
    }),
    stream: ({ params }) => {
      const { clientType, currency, dateFrom, dateTo, page, search, status } = params;

      return this.invoicesService.getList({
        page: page + 1,
        limit: PAGE_SIZE,
        status: status.length > 0 ? status : undefined,
        clientType: this.parseClientType(clientType),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        currency: currency || undefined,
        search: search || undefined,
      });
    },
  });

  private readonly summaryData = rxResource({
    params: () => true,
    stream: () => this.invoicesService.getSummary(),
  });

  protected readonly invoices = computed(() => this.data.value()?.items ?? []);
  protected readonly totalElements = computed(() => this.data.value()?.total ?? 0);
  protected readonly loading = computed(() => this.data.isLoading());
  protected readonly summary = computed<InvoiceSummaryResponseDto>(() => {
    const apiSummary = this.summaryData.value();

    if (apiSummary) {
      return apiSummary;
    }

    const items = this.invoices();
    const currency = items[0]?.currency ?? 'BYN';

    const drafts = items.filter((item) => item.status === InvoiceStatus.DRAFT).length;
    const pendingItems = items.filter(
      (item) =>
        item.status === InvoiceStatus.ISSUED || item.status === InvoiceStatus.PARTIALLY_PAID,
    );
    const overdueItems = items.filter((item) => item.status === InvoiceStatus.OVERDUE);

    return {
      drafts,
      pendingCount: pendingItems.length,
      pendingAmount: pendingItems.reduce((sum, item) => sum + (item.total ?? 0), 0),
      overdueCount: overdueItems.length,
      overdueAmount: overdueItems.reduce((sum, item) => sum + (item.total ?? 0), 0),
      currency,
    };
  });

  protected readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load invoices';
    }

    return undefined;
  });

  protected readonly displayedColumns: string[] = [
    'number',
    'client',
    'type',
    'invoiceDate',
    'dueDate',
    'total',
    'status',
    'paidAmount',
  ];

  constructor() {
    this.syncStateFromQueryParams();
    this.syncSearchDebounce();
    this.syncQueryParamsFromState();
  }

  onStatusFilterChange(statuses: InvoiceStatus[]): void {
    this.statusFilter.set(statuses ?? []);
    this.currentPage.set(0);
  }

  onClientTypeFilterChange(clientType: string): void {
    this.clientTypeFilter.set(clientType ?? '');
    this.currentPage.set(0);
  }

  onDateFromChange(value: string): void {
    this.dateFromFilter.set(value ?? '');
    this.currentPage.set(0);
  }

  onDateToChange(value: string): void {
    this.dateToFilter.set(value ?? '');
    this.currentPage.set(0);
  }

  onCurrencyFilterChange(value: string): void {
    this.currencyFilter.set(value ?? '');
    this.currentPage.set(0);
  }

  onSummaryPresetSelect(statuses: InvoiceStatus[]): void {
    this.statusFilter.set(statuses);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
  }

  navigateToCreateInvoice(): void {
    this.router.navigate(['/app/invoices/new']);
  }

  navigateToInvoice(id: string): void {
    this.router.navigate(['/app/invoices', id]);
  }

  formatDate(value: string): string {
    try {
      return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return value;
    }
  }

  formatAmount(value: number | undefined, currency: string): string {
    const amount = value ?? 0;

    return `${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)} ${currency}`;
  }

  paidAmountLabel(invoice: InvoiceResponseDto): string {
    const paid = invoice.paidAmount ?? 0;
    const total = invoice.total ?? 0;

    return `${this.formatAmount(paid, invoice.currency)} / ${this.formatAmount(total, invoice.currency)}`;
  }

  onInvoiceNumberClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onActionClick(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.navigateToInvoice(id);
  }

  private syncStateFromQueryParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        this.applyingQueryParams.set(true);

        const page = Number(queryParams.get('page') ?? '0');
        const status = this.parseStatus(queryParams.get('status'));
        const clientType = queryParams.get('clientType') ?? '';
        const dateFrom = queryParams.get('dateFrom') ?? '';
        const dateTo = queryParams.get('dateTo') ?? '';
        const currency = queryParams.get('currency') ?? '';
        const search = queryParams.get('search') ?? '';

        this.currentPage.set(Number.isFinite(page) && page > 0 ? page : 0);
        this.statusFilter.set(status);
        this.clientTypeFilter.set(clientType);
        this.dateFromFilter.set(dateFrom);
        this.dateToFilter.set(dateTo);
        this.currencyFilter.set(currency);
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
      const clientType = this.clientTypeFilter();
      const dateFrom = this.dateFromFilter();
      const dateTo = this.dateToFilter();
      const currency = this.currencyFilter();
      const search = this.searchFilter();
      const page = this.currentPage();

      const queryParams: Record<string, string | number | undefined> = {
        status: status.length > 0 ? status.join(',') : undefined,
        clientType: clientType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        currency: currency || undefined,
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

  private parseStatus(statusValue: string | null): InvoiceStatus[] {
    if (!statusValue) {
      return [];
    }

    const statuses = statusValue
      .split(',')
      .map((item) => item.trim() as InvoiceStatus)
      .filter((item) => INVOICE_STATUSES.has(item));

    return Array.from(new Set(statuses));
  }

  private parseClientType(value: string): ClientType | undefined {
    const clientType = value as ClientType;

    if (CLIENT_TYPES.has(clientType)) {
      return clientType;
    }

    return undefined;
  }
}
