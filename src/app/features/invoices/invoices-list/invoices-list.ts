import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { InvoicesService } from '@app/services/invoices.service';
import { MAT_BUTTON_TOGGLES, MAT_BUTTONS } from '@app/shared/material-imports';
import { InvoiceStatus } from '@app/shared/models';

import type { InvoiceResponseDto } from '@app/shared/models';
type FilterTab = 'ALL' | InvoiceStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: InvoiceStatus.DRAFT, label: 'Draft' },
  { value: InvoiceStatus.ISSUED, label: 'Issued' },
  { value: InvoiceStatus.PAID, label: 'Paid' },
  { value: InvoiceStatus.PARTIALLY_PAID, label: 'Partially paid' },
  { value: InvoiceStatus.OVERDUE, label: 'Overdue' },
  { value: InvoiceStatus.CANCELLED, label: 'Cancelled' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoices-list',
  imports: [RouterLink, ...MAT_BUTTONS, ...MAT_BUTTON_TOGGLES],
  templateUrl: './invoices-list.html',
  styleUrl: './invoices-list.scss',
})
export class InvoicesListComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly router = inject(Router);

  readonly activeFilter = signal<FilterTab>('ALL');
  private readonly data = rxResource({
    stream: () =>
      this.invoicesService.getList({
        page: 1,
        limit: 50,
      }),
  });

  readonly filterTabs = FILTER_TABS;
  readonly statusBadgeClass = STATUS_BADGE_CLASS;
  readonly invoices = computed(() => {
    const items = this.data.value()?.items ?? [];
    const filter = this.activeFilter();

    if (filter === 'ALL') {
      return items;
    }

    return items.filter((invoice) => invoice.status === filter);
  });
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load invoices';
    }

    return undefined;
  });

  setFilter(value: FilterTab): void {
    this.activeFilter.set(value);
  }

  goToDetail(invoice: InvoiceResponseDto): void {
    this.router.navigate(['/app/invoices', invoice.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  getStatusBadgeClass(status: string): string {
    return STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-500';
  }
}
