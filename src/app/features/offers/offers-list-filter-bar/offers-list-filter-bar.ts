import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { OfferStatus } from '@app/shared/models';

type OfferStatusOption = {
  value: OfferStatus;
  label: string;
};

type AgentOption = {
  id: string;
  name: string;
};

@Component({
  selector: 'app-offers-list-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...MAT_FORM_BUTTONS, ReactiveFormsModule],
  templateUrl: './offers-list-filter-bar.html',
  styleUrl: './offers-list-filter-bar.scss',
})
export class OffersListFilterBarComponent {
  readonly statusFilter = input.required<OfferStatus[]>();
  readonly statusOptions = input.required<OfferStatusOption[]>();
  readonly showAgentFilter = input.required<boolean>();
  readonly selectedAgentId = input.required<string>();
  readonly agentOptions = input.required<AgentOption[]>();
  readonly dateFromFilter = input.required<string>();
  readonly dateToFilter = input.required<string>();
  readonly searchControl = input.required<FormControl<string>>();

  readonly statusFilterChange = output<OfferStatus[]>();
  readonly agentFilterChange = output<string>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();

  onStatusSelectionChange(statuses: OfferStatus[]): void {
    this.statusFilterChange.emit(statuses ?? []);
  }

  onAgentSelectionChange(agentId: string): void {
    this.agentFilterChange.emit(agentId ?? '');
  }

  onDateFromInputChange(value: string): void {
    this.dateFromChange.emit(value);
  }

  onDateToInputChange(value: string): void {
    this.dateToChange.emit(value);
  }
}
