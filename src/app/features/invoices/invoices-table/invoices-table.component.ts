import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import { InvoiceStatusChipComponent } from '@app/features/invoices/invoice-status-chip/invoice-status-chip';

import type { InvoiceResponseDto } from '@app/shared/models';

const ALL_COLUMNS = [
  'number',
  'client',
  'type',
  'invoiceDate',
  'dueDate',
  'total',
  'status',
  'paidAmount',
  'createdAt',
] as const;

@Component({
  selector: 'app-invoices-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink,
    ClientTypeBadgeComponent,
    InvoiceStatusChipComponent,
  ],
  templateUrl: './invoices-table.component.html',
  styleUrl: './invoices-table.component.scss',
  host: { class: 'table-wrap' },
})
export class InvoicesTableComponent {
  readonly invoices = input<InvoiceResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);

  private readonly router = inject(Router);

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  navigateToInvoice(id: string): void {
    void this.router.navigate(['/app/invoices', id]);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

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

  onNumberClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
