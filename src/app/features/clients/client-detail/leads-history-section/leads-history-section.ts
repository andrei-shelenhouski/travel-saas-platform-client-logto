import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { map } from 'rxjs/operators';

import { ClientsService } from '@app/services/clients.service';
import { LeadStatusChipComponent } from '@app/shared/components';
import { MAT_BUTTONS } from '@app/shared/material-imports';

import type { LeadResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-leads-history-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatTableModule, LeadStatusChipComponent, ...MAT_BUTTONS],
  templateUrl: './leads-history-section.html',
  styleUrl: './leads-history-section.scss',
})
export class LeadsHistorySectionComponent {
  readonly clientId = input.required<string>();

  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);

  private readonly leadsData = rxResource<LeadResponseDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) =>
      this.clientsService.getLeads(params, { page: 1, limit: 20 }).pipe(map((r) => r.items)),
  });

  readonly leads = computed(() => this.leadsData.value() ?? []);
  readonly loading = computed(() => this.leadsData.isLoading());

  readonly columns = ['number', 'status', 'createdAt'] as const;

  formatDateShort(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  goToLead(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
  }
}
