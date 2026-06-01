import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type InvoiceTotals = {
  subtotal: number;
  total: number;
  totalCommission: number;
  totalVat: number;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-totals-display',
  imports: [],
  templateUrl: './invoice-totals-display.html',
})
export class InvoiceTotalsDisplayComponent {
  readonly totals = input.required<InvoiceTotals>();
  readonly currency = input<string>('');
  readonly isB2bMode = input<boolean>(false);

  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
