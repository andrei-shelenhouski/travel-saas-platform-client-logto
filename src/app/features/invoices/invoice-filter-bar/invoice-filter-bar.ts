import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ClientType, InvoiceStatus } from '@app/shared/models';

type InvoiceStatusOption = {
  value: InvoiceStatus;
  label: string;
};

type ClientTypeOption = {
  value: ClientType;
  label: string;
};

const STATUS_OPTIONS: InvoiceStatusOption[] = [
  { value: InvoiceStatus.DRAFT, label: $localize`:@@invoiceFilterStatusDraft:Draft` },
  { value: InvoiceStatus.ISSUED, label: $localize`:@@invoiceFilterStatusIssued:Issued` },
  {
    value: InvoiceStatus.PARTIALLY_PAID,
    label: $localize`:@@invoiceFilterStatusPartiallyPaid:Partially paid`,
  },
  { value: InvoiceStatus.PAID, label: $localize`:@@invoiceFilterStatusPaid:Paid` },
  { value: InvoiceStatus.OVERDUE, label: $localize`:@@invoiceFilterStatusOverdue:Overdue` },
  { value: InvoiceStatus.CANCELLED, label: $localize`:@@invoiceFilterStatusCancelled:Cancelled` },
];

const CLIENT_TYPE_OPTIONS: ClientTypeOption[] = [
  {
    value: ClientType.INDIVIDUAL,
    label: $localize`:@@invoiceFilterClientTypeIndividual:Individual`,
  },
  { value: ClientType.COMPANY, label: $localize`:@@invoiceFilterClientTypeCompany:Company` },
  { value: ClientType.B2B_AGENT, label: $localize`:@@invoiceFilterClientTypeB2bAgent:B2B agent` },
];

@Component({
  selector: 'app-invoice-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...MAT_FORM_BUTTONS, ReactiveFormsModule],
  templateUrl: './invoice-filter-bar.html',
  styleUrl: './invoice-filter-bar.scss',
})
export class InvoiceFilterBarComponent {
  readonly statusFilter = input.required<InvoiceStatus[]>();
  readonly clientTypeFilter = input.required<string>();
  readonly dateFromFilter = input.required<string>();
  readonly dateToFilter = input.required<string>();
  readonly currencyFilter = input.required<string>();
  readonly searchControl = input.required<FormControl<string>>();

  readonly statusFilterChange = output<InvoiceStatus[]>();
  readonly clientTypeFilterChange = output<string>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();
  readonly currencyFilterChange = output<string>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly clientTypeOptions = CLIENT_TYPE_OPTIONS;

  onStatusSelectionChange(statuses: InvoiceStatus[]): void {
    this.statusFilterChange.emit(statuses ?? []);
  }

  onClientTypeSelectionChange(clientType: string): void {
    this.clientTypeFilterChange.emit(clientType ?? '');
  }

  onDateFromInputChange(value: string): void {
    this.dateFromChange.emit(value);
  }

  onDateToInputChange(value: string): void {
    this.dateToChange.emit(value);
  }

  onCurrencyInputChange(value: string): void {
    this.currencyFilterChange.emit(value.trim().toUpperCase());
  }
}
