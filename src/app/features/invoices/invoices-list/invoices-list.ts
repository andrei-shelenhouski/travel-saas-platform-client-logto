import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

import { InvoicesService } from '../../../services/invoices.service';
import type { InvoiceResponseDto } from '../../../shared/models';
import { InvoiceStatus } from '../../../shared/models';

type FilterTab = 'ALL' | InvoiceStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: InvoiceStatus.DRAFT, label: 'Draft' },
  { value: InvoiceStatus.SENT, label: 'Sent' },
  { value: InvoiceStatus.PAID, label: 'Paid' },
  { value: InvoiceStatus.CANCELLED, label: 'Cancelled' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

@Component({
  selector: 'app-invoices-list',
  imports: [RouterLink],
  templateUrl: './invoices-list.html',
  styleUrl: './invoices-list.css',
})
export class InvoicesListComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly router = inject(Router);

  readonly activeFilter = signal<FilterTab>('ALL');
  private readonly data = rxResource({
    params: () => ({ status: this.activeFilter() === 'ALL' ? undefined : this.activeFilter() }),
    stream: ({ params }) =>
      this.invoicesService.getList({
        page: 1,
        limit: 50,
        status: params.status as InvoiceStatus | undefined,
      }),
  });

  readonly filterTabs = FILTER_TABS;
  readonly statusBadgeClass = STATUS_BADGE_CLASS;
  readonly invoices = computed(() => this.data.value()?.data ?? []);
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
