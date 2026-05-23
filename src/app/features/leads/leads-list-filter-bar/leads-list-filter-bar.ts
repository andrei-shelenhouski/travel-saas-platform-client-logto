import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { LeadStatus } from '@app/shared/models';
type LeadStatusOption = {
  value: LeadStatus;
  label: string;
};

type AgentOption = {
  id: string;
  name: string;
};

type ClientTypeOption = {
  value: string;
  label: string;
};

type SourceOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-leads-list-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...MAT_FORM_BUTTONS, ReactiveFormsModule, MatIconModule],
  templateUrl: './leads-list-filter-bar.html',
  styleUrl: './leads-list-filter-bar.scss',
})
export class LeadsListFilterBarComponent {
  readonly statusFilter = input.required<LeadStatus[]>();
  readonly statusOptions = input.required<LeadStatusOption[]>();
  readonly showAgentFilter = input.required<boolean>();
  readonly selectedAgentId = input.required<string>();
  readonly agentOptions = input.required<AgentOption[]>();
  readonly clientTypeFilter = input.required<string>();
  readonly clientTypeOptions = input.required<ClientTypeOption[]>();
  readonly sourceFilter = input.required<string>();
  readonly sourceOptions = input.required<SourceOption[]>();
  readonly dateFromFilter = input.required<string>();
  readonly dateToFilter = input.required<string>();
  readonly searchControl = input.required<FormControl<string>>();

  readonly statusFilterChange = output<LeadStatus[]>();
  readonly agentFilterChange = output<string>();
  readonly clientTypeFilterChange = output<string>();
  readonly sourceFilterChange = output<string>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();

  onStatusSelectionChange(statuses: LeadStatus[]): void {
    this.statusFilterChange.emit(statuses ?? []);
  }

  onAgentSelectionChange(agentId: string): void {
    this.agentFilterChange.emit(agentId ?? '');
  }

  onClientTypeSelectionChange(clientType: string): void {
    this.clientTypeFilterChange.emit(clientType ?? '');
  }

  onSourceSelectionChange(source: string): void {
    this.sourceFilterChange.emit(source ?? '');
  }

  onDateFromInputChange(value: string): void {
    this.dateFromChange.emit(value);
  }

  onDateToInputChange(value: string): void {
    this.dateToChange.emit(value);
  }
}
