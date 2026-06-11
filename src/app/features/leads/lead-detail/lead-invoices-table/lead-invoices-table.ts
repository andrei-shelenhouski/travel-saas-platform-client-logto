import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InvoiceStatusChipComponent } from '@app/features/invoices/invoice-status-chip/invoice-status-chip';

import type { InvoiceResponseDto } from '@app/shared/models';

const ALL_COLUMNS = ['number', 'invoiceDate', 'dueDate', 'status', 'total', 'paidAmount'] as const;

type Column = (typeof ALL_COLUMNS)[number];

@Component({
  selector: 'app-lead-invoices-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, MatProgressSpinnerModule, InvoiceStatusChipComponent],
  templateUrl: './lead-invoices-table.html',
  styleUrl: './lead-invoices-table.scss',
  host: { class: 'table-wrap' },
})
export class LeadInvoicesTableComponent {
  readonly invoices = input<InvoiceResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);

  readonly rowClicked = output<string>();

  private readonly router = inject(Router);

  readonly displayedColumns = computed<Column[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  onRowClick(id: string): void {
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

  formatCurrency(amount: number | undefined, currency: string | undefined): string {
    if (amount === undefined || currency === undefined) {
      return '—';
    }

    try {
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  }
}
