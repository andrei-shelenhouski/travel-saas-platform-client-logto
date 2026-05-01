import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
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
  DRAFT: 'Черновик',
  ISSUED: 'Выставлен',
  PAID: 'Оплачен',
  PARTIALLY_PAID: 'Частично оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
};

@Component({
  selector: 'app-invoice-list-mini',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, ...MAT_BUTTONS, ...MAT_ICONS],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">Счета</h2>
        @if (canCreateInvoice()) {
          <a
            mat-stroked-button
            [queryParams]="{ bookingId: booking().id }"
            [routerLink]="['/app/invoices/new']"
          >
            <mat-icon>add</mat-icon>
            Создать счёт
          </a>
        }
      </div>

      <div class="mt-3 space-y-2">
        @for (invoice of invoices(); track invoice.id) {
          <a
            class="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
            [routerLink]="['/app/invoices', invoice.id]"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900">Счёт #{{ invoice.number }}</p>
              <p class="text-xs text-gray-500">
                {{ invoice.invoiceDate | date: 'mediumDate' }} &middot; {{ invoice.currency }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold text-gray-900">
                {{ invoice.total ?? 0 | number: '1.0-2' }} {{ invoice.currency }}
              </span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                [class]="invoiceStatusClass(invoice.status)"
              >
                {{ invoiceStatusLabel(invoice.status) }}
              </span>
            </div>
          </a>
        } @empty {
          <p class="text-sm text-gray-500">Счета не созданы</p>
        }
      </div>
    </section>
  `,
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
