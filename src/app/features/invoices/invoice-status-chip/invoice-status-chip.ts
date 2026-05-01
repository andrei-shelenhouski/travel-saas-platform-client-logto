import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { InvoiceStatus } from '@app/shared/models';

const INVOICE_STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-sky-100 text-sky-700',
  PARTIALLY_PAID: 'bg-teal-100 text-teal-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500 line-through',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  [InvoiceStatus.DRAFT]: $localize`:@@invoiceStatusLabelDraft:Draft`,
  [InvoiceStatus.ISSUED]: $localize`:@@invoiceStatusLabelIssued:Issued`,
  [InvoiceStatus.PARTIALLY_PAID]: $localize`:@@invoiceStatusLabelPartiallyPaid:Partially paid`,
  [InvoiceStatus.PAID]: $localize`:@@invoiceStatusLabelPaid:Paid`,
  [InvoiceStatus.OVERDUE]: $localize`:@@invoiceStatusLabelOverdue:Overdue`,
  [InvoiceStatus.CANCELLED]: $localize`:@@invoiceStatusLabelCancelled:Cancelled`,
};

@Component({
  selector: 'app-invoice-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-status-chip.html',
  styleUrl: './invoice-status-chip.scss',
})
export class InvoiceStatusChipComponent {
  readonly status = input.required<string>();

  protected readonly classes = computed(() => {
    const status = this.status();

    return INVOICE_STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-500';
  });

  protected readonly label = computed(() => {
    const status = this.status();

    return INVOICE_STATUS_LABELS[status] ?? status;
  });
}
