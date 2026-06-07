import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CLIENT_TYPE_OPTIONS, InvoiceStatus } from '@app/shared/models';

type InvoiceStatusOption = {
  value: InvoiceStatus;
  label: string;
};

const STATUS_OPTIONS: InvoiceStatusOption[] = [
  { value: InvoiceStatus.DRAFT, label: 'Черновик' },
  { value: InvoiceStatus.ISSUED, label: 'Выставлен' },
  {
    value: InvoiceStatus.PARTIALLY_PAID,
    label: 'Частично оплачен',
  },
  { value: InvoiceStatus.PAID, label: 'Оплачен' },
  { value: InvoiceStatus.OVERDUE, label: 'Просрочен' },
  { value: InvoiceStatus.CANCELLED, label: 'Отменен' },
];

@Component({
  selector: 'app-invoice-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
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
