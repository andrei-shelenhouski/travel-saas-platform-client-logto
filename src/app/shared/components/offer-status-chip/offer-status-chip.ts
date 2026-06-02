import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  StatusChipComponent,
  type StatusChipConfig,
} from '@app/shared/components/status-chip/status-chip';

export const OFFER_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#73787a',
  NEW: '#73787a',
  OPEN: '#2b9db8',
  SENT: '#d97706',
  OFFER_SENT: '#d97706',
  VIEWED: '#d97706',
  ACCEPTED: '#16a34a',
  WON: '#16a34a',
  REJECTED: '#ba1a1a',
  LOST: '#73787a',
  EXPIRED: '#ba1a1a',
  CLOSED: '#73787a',
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  NEW: 'Новое',
  OPEN: 'Открыто',
  SENT: 'Отправлено',
  OFFER_SENT: 'Предложение отправлено',
  VIEWED: 'Просмотрено',
  ACCEPTED: 'Принято',
  WON: 'Выиграно',
  REJECTED: 'Отклонено',
  LOST: 'Проиграно',
  EXPIRED: 'Просрочено',
  CLOSED: 'Закрыто',
};

const OFFER_STATUS_CONFIG: StatusChipConfig = Object.fromEntries(
  Object.keys(OFFER_STATUS_LABELS).map((key) => [
    key,
    { label: OFFER_STATUS_LABELS[key], backgroundColor: OFFER_STATUS_COLORS[key] },
  ]),
);

@Component({
  selector: 'app-offer-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent],
  templateUrl: './offer-status-chip.html',
  styleUrl: './offer-status-chip.scss',
})
export class OfferStatusChipComponent {
  readonly status = input<string | null | undefined>(null);
  protected readonly config = OFFER_STATUS_CONFIG;
}
