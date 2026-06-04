import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { InvoiceStatus } from '@app/shared/models';

const INVOICE_STATUS_MODIFIER: Record<string, string> = {
  DRAFT: 'invoice-status-chip--draft',
  ISSUED: 'invoice-status-chip--issued',
  PARTIALLY_PAID: 'invoice-status-chip--partially-paid',
  PAID: 'invoice-status-chip--paid',
  OVERDUE: 'invoice-status-chip--overdue',
  CANCELLED: 'invoice-status-chip--cancelled',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  [InvoiceStatus.DRAFT]: 'Черновик',
  [InvoiceStatus.ISSUED]: 'Выставлен',
  [InvoiceStatus.PARTIALLY_PAID]: 'Частично оплачен',
  [InvoiceStatus.PAID]: 'Оплачен',
  [InvoiceStatus.OVERDUE]: 'Просрочен',
  [InvoiceStatus.CANCELLED]: 'Отменен',
};

@Component({
  selector: 'app-invoice-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-status-chip.html',
  styleUrl: './invoice-status-chip.scss',
})
export class InvoiceStatusChipComponent {
  readonly status = input.required<string>();

  protected readonly chipClass = computed(() => {
    const status = this.status();

    return INVOICE_STATUS_MODIFIER[status] ?? 'invoice-status-chip--draft';
  });

  protected readonly label = computed(() => {
    const status = this.status();

    return INVOICE_STATUS_LABELS[status] ?? status;
  });
}
