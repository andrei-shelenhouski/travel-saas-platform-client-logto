import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { map } from 'rxjs/operators';

import { LeadsTableComponent } from '@app/features/leads/leads-table/leads-table.component';
import { ClientsService } from '@app/services/clients.service';

import type { LeadResponseDto } from '@app/shared/models';

const HISTORY_OMIT_COLUMNS = [
  'name',
  'clientType',
  'dates',
  'updatedAt',
  'contactEmail',
  'contactPhone',
  'actions',
];

@Component({
  selector: 'app-leads-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, LeadsTableComponent],
  templateUrl: './leads-history-section.html',
  styleUrl: './leads-history-section.scss',
})
export class LeadsHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly clientsService = inject(ClientsService);

  private readonly leadsData = rxResource<LeadResponseDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getLeads(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly leads = computed(() => this.leadsData.value() ?? []);
  readonly loading = computed(() => this.leadsData.isLoading());

  protected readonly omitColumns = HISTORY_OMIT_COLUMNS;
}
