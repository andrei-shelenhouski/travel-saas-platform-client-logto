import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import type { InvoiceLineItemResponseDto } from '@app/shared/models';

const ALL_COLUMNS = [
  'description',
  'serviceDates',
  'travelers',
  'unitPrice',
  'quantity',
  'total',
  'tourCost',
  'commissionAmount',
  'commissionVat',
  'netToPay',
] as const;

type Column = (typeof ALL_COLUMNS)[number];

@Component({
  selector: 'app-invoice-line-items-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, DecimalPipe, MatProgressSpinnerModule],
  templateUrl: './invoice-line-items-table.html',
  styleUrl: './invoice-line-items-table.scss',
})
export class InvoiceLineItemsTableComponent {
  readonly items = input<InvoiceLineItemResponseDto[]>([]);
  readonly currency = input<string>('');
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);

  readonly displayedColumns = computed<string[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col): col is Column => !omit.has(col));
  });

  formatServiceDates(from?: string | null, to?: string | null): string {
    if (!from && !to) {
      return '—';
    }

    if (from && to) {
      return `${this.formatDateOnly(from)} – ${this.formatDateOnly(to)}`;
    }

    return this.formatDateOnly(from ?? to);
  }

  private formatDateOnly(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return iso.slice(0, 10);
  }
}
