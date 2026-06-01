import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  StatusChipComponent,
  type StatusChipConfig,
} from '@app/shared/components/status-chip/status-chip';

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  NEW: '#73787a',
  OPEN: '#2b9db8',
  IN_PROGRESS: '#2b9db8',
  QUOTED: '#d97706',
  WON: '#16a34a',
  LOST: '#73787a',
  EXPIRED: '#ba1a1a',
  CLOSED: '#73787a',
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  OPEN: 'Открыт',
  IN_PROGRESS: 'В работе',
  QUOTED: 'Предложение готово',
  WON: 'Выигран',
  LOST: 'Проигран',
  EXPIRED: 'Просрочен',
  CLOSED: 'Закрыт',
};

const REQUEST_STATUS_CONFIG: StatusChipConfig = Object.fromEntries(
  Object.keys(REQUEST_STATUS_LABELS).map((key) => [
    key,
    { label: REQUEST_STATUS_LABELS[key], backgroundColor: REQUEST_STATUS_COLORS[key] },
  ]),
);

@Component({
  selector: 'app-request-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusChipComponent],
  template: `<app-status-chip [config]="config" [status]="status()" />`,
})
export class RequestStatusChipComponent {
  readonly status = input<string | null | undefined>(null);
  protected readonly config = REQUEST_STATUS_CONFIG;
}
