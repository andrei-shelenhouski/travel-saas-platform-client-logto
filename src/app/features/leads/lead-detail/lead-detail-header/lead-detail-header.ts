import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LeadSourceBadgeComponent } from '@app/features/leads/lead-source-badge/lead-source-badge';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';

import type { LeadResponseDto } from '@app/shared/models';

export type LeadAction = 'assign' | 'to_in_progress' | 'to_offer_sent' | 'mark_lost';

const ACTION_LABELS: Record<LeadAction, string> = {
  assign: 'Назначить',
  to_in_progress: 'В работе',
  to_offer_sent: 'КП отправлено',
  mark_lost: 'Проигран',
};

const ACTION_ICONS: Record<LeadAction, string> = {
  assign: 'person_add',
  to_in_progress: 'play_arrow',
  to_offer_sent: 'description',
  mark_lost: 'cancel',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail-header',
  styleUrl: './lead-detail-header.scss',
  imports: [
    MatIconModule,
    MatButtonModule,
    PageHeading,
    PageHeadingAction,
    StatusBadgeComponent,
    LeadSourceBadgeComponent,
  ],
  templateUrl: './lead-detail-header.html',
})
export class LeadDetailHeaderComponent {
  readonly lead = input.required<LeadResponseDto>();
  readonly visibleActions = input<LeadAction[]>([]);
  readonly statusActionLoading = input<LeadAction | null>(null);
  readonly isTerminalLead = input<boolean>(false);
  readonly isDeletedLead = input<boolean>(false);
  readonly canDeleteLead = input<boolean>(false);

  readonly editDetailsClicked = output<void>();
  readonly actionClicked = output<LeadAction>();
  readonly deleteClicked = output<void>();

  protected readonly ACTION_LABELS = ACTION_LABELS;
  protected readonly ACTION_ICONS = ACTION_ICONS;

  protected readonly tourvisorExternalLeadId = computed(() => {
    const lead = this.lead();

    if (lead?.source !== 'TOURVISOR') {
      return null;
    }

    const dynamicLead = lead as Record<string, unknown>;
    const externalLeadId = dynamicLead['externalLeadId'] ?? dynamicLead['external_lead_id'];

    if (typeof externalLeadId === 'string') {
      const trimmed = externalLeadId.trim();

      return trimmed.length > 0 ? trimmed : null;
    }

    return null;
  });

  protected isActionBusy(action: LeadAction): boolean {
    return this.statusActionLoading() === action;
  }
}
