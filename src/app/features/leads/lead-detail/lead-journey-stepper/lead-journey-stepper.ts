import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { StatusChipComponent } from '@app/shared/components/status-chip/status-chip';
import { LeadStatus } from '@app/shared/models';

import type { BookingResponseDto, LeadResponseDto, OfferResponseDto } from '@app/shared/models';
import type { LeadAction } from '../lead-detail-header/lead-detail-header';

const JOURNEY_STEPS: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.ASSIGNED,
  LeadStatus.IN_PROGRESS,
  LeadStatus.OFFER_SENT,
  LeadStatus.WON,
];

const STEP_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  ASSIGNED: 'Назначен',
  IN_PROGRESS: 'В работе',
  OFFER_SENT: 'КП отправлено',
  WON: 'Выигран',
};

const OFFER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлено',
  VIEWED: 'Просмотрено',
  ACCEPTED: 'Принято',
  REJECTED: 'Отклонено',
  EXPIRED: 'Истекло',
};

const OFFER_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9ca3af',
  SENT: '#2b9db8',
  VIEWED: '#7c3aed',
  ACCEPTED: '#16a34a',
  REJECTED: '#dc2626',
  EXPIRED: '#d97706',
};

const OFFER_STATUS_CONFIG = Object.fromEntries(
  Object.keys(OFFER_STATUS_LABELS).map((key) => [
    key,
    { label: OFFER_STATUS_LABELS[key], backgroundColor: OFFER_STATUS_COLORS[key] },
  ]),
);

export type StepState = 'completed' | 'active' | 'future';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-journey-stepper',
  imports: [
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    BookingStatusChipComponent,
    StatusChipComponent,
  ],
  templateUrl: './lead-journey-stepper.html',
  styleUrl: './lead-journey-stepper.scss',
})
export class LeadJourneyStepperComponent {
  readonly lead = input.required<LeadResponseDto>();
  readonly offers = input<OfferResponseDto[]>([]);
  readonly booking = input<BookingResponseDto | null>(null);
  readonly canCreateOffer = input<boolean>(false);
  readonly statusActionLoading = input<LeadAction | null>(null);
  readonly visibleActions = input<LeadAction[]>([]);

  readonly actionClicked = output<LeadAction>();
  readonly createOfferClicked = output<void>();

  protected readonly JOURNEY_STEPS = JOURNEY_STEPS;
  protected readonly STEP_STATUS_LABELS = STEP_STATUS_LABELS;
  protected readonly OFFER_STATUS_CONFIG = OFFER_STATUS_CONFIG;

  protected readonly currentStepIndex = computed(() => {
    const status = this.lead().status;
    const idx = JOURNEY_STEPS.indexOf(status as LeadStatus);

    return idx;
  });

  protected readonly isTerminal = computed(() => {
    const status = this.lead().status;

    return (
      status === LeadStatus.LOST || status === LeadStatus.EXPIRED || status === LeadStatus.CONVERTED
    );
  });

  protected readonly terminalLabel = computed(() => {
    const status = this.lead().status;

    if (status === LeadStatus.LOST) {
      return 'Проигран';
    }

    if (status === LeadStatus.EXPIRED) {
      return 'Истёк';
    }

    if (status === LeadStatus.CONVERTED) {
      return 'Конвертирован';
    }

    return null;
  });

  protected readonly terminalClass = computed(() => {
    const status = this.lead().status;

    if (status === LeadStatus.LOST) {
      return 'terminal-chip--lost';
    }

    if (status === LeadStatus.EXPIRED) {
      return 'terminal-chip--expired';
    }

    if (status === LeadStatus.CONVERTED) {
      return 'terminal-chip--converted';
    }

    return '';
  });

  protected readonly previewOffers = computed(() => this.offers().slice(0, 3));

  protected getStepState(index: number): StepState {
    const current = this.currentStepIndex();

    if (current === -1) {
      return index === 0 ? 'active' : 'future';
    }

    if (index < current) {
      return 'completed';
    }

    if (index === current) {
      return 'active';
    }

    return 'future';
  }

  protected isActionLoading(action: LeadAction): boolean {
    return this.statusActionLoading() === action;
  }

  protected isActionVisible(action: LeadAction): boolean {
    return this.visibleActions().includes(action);
  }

  protected scrollToOffers(): void {
    document.getElementById('lead-offers-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}
