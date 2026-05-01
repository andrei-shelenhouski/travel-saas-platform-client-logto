import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';

import type { BookingResponseDto, InvoiceResponseDto } from '@app/shared/models';

const INVOICE_STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500 line-through',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: $localize`:@@invoiceStatusDraft:Draft`,
  ISSUED: $localize`:@@invoiceStatusIssued:Issued`,
  PAID: $localize`:@@invoiceStatusPaid:Paid`,
  PARTIALLY_PAID: $localize`:@@invoiceStatusPartiallyPaid:Partially paid`,
  OVERDUE: $localize`:@@invoiceStatusOverdue:Overdue`,
  CANCELLED: $localize`:@@invoiceStatusCancelled:Cancelled`,
};

@Component({
  selector: 'app-invoice-list-mini',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './invoice-list-mini.html',
  styleUrl: './invoice-list-mini.scss',
})
export class InvoiceListMiniComponent {
  readonly invoices = input<InvoiceResponseDto[]>([]);
  readonly booking = input.required<BookingResponseDto>();

  readonly canCreateInvoice = computed(() => this.booking().status !== BookingStatus.CANCELLED);

  invoiceStatusClass(status: string): string {
    return INVOICE_STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-500';
  }

  invoiceStatusLabel(status: string): string {
    return INVOICE_STATUS_LABELS[status] ?? status;
  }
}
