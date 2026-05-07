import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { InvoiceStatus } from '@app/shared/models';

@Component({
  selector: 'app-invoice-summary-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-summary-cards.html',
  styleUrl: './invoice-summary-cards.scss',
})
export class InvoiceSummaryCardsComponent {
  readonly drafts = input.required<number>();
  readonly pendingCount = input.required<number>();
  readonly pendingAmount = input.required<number>();
  readonly overdueCount = input.required<number>();
  readonly overdueAmount = input.required<number>();
  readonly currency = input('BYN');
  readonly selectedStatuses = input<InvoiceStatus[]>([]);

  readonly statusesSelect = output<InvoiceStatus[]>();

  protected readonly isDraftActive = computed(() =>
    this.isPresetActive([InvoiceStatus.DRAFT], this.selectedStatuses()),
  );

  protected readonly isPendingActive = computed(() =>
    this.isPresetActive(
      [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID],
      this.selectedStatuses(),
    ),
  );

  protected readonly isOverdueActive = computed(() =>
    this.isPresetActive([InvoiceStatus.OVERDUE], this.selectedStatuses()),
  );

  onDraftClick(): void {
    this.statusesSelect.emit([InvoiceStatus.DRAFT]);
  }

  onPendingClick(): void {
    this.statusesSelect.emit([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID]);
  }

  onOverdueClick(): void {
    this.statusesSelect.emit([InvoiceStatus.OVERDUE]);
  }

  protected formatAmount(value: number): string {
    const amount = Number.isFinite(value) ? value : 0;

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private isPresetActive(preset: InvoiceStatus[], selected: InvoiceStatus[]): boolean {
    if (preset.length !== selected.length) {
      return false;
    }

    const selectedSet = new Set(selected);

    return preset.every((status) => selectedSet.has(status));
  }
}
