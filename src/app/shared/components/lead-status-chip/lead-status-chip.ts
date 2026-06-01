import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  StatusChipComponent,
  type StatusChipConfig,
} from '@app/shared/components/status-chip/status-chip';

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: '#73787a',
  OPEN: '#2b9db8',
  ASSIGNED: '#2b9db8',
  IN_PROGRESS: '#2b9db8',
  OFFER_SENT: '#d97706',
  QUOTED: '#d97706',
  WON: '#16a34a',
  LOST: '#73787a',
  EXPIRED: '#ba1a1a',
  CLOSED: '#73787a',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  OPEN: 'Открыт',
  ASSIGNED: 'Назначен',
  IN_PROGRESS: 'В работе',
  OFFER_SENT: 'Предложение отправлено',
  QUOTED: 'Предложение готово',
  WON: 'Выигран',
  LOST: 'Проигран',
  EXPIRED: 'Просрочен',
  CLOSED: 'Закрыт',
};

const LEAD_STATUS_CONFIG: StatusChipConfig = Object.fromEntries(
  Object.keys(LEAD_STATUS_LABELS).map((key) => [
    key,
    { label: LEAD_STATUS_LABELS[key], backgroundColor: LEAD_STATUS_COLORS[key] },
  ]),
);

@Component({
  selector: 'app-lead-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent],
  template: `<app-status-chip [config]="config" [status]="status()" />`,
})
export class LeadStatusChipComponent {
  readonly status = input<string | null | undefined>(null);
  protected readonly config = LEAD_STATUS_CONFIG;
}
