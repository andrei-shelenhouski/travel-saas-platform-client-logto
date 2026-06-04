import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  StatusChipComponent,
  StatusChipConfig,
} from '@app/shared/components/status-chip/status-chip';

export type StatusBadgeVariant = 'lead' | 'offer' | 'generic';

const LEAD_CONFIG: StatusChipConfig = {
  NEW: { label: 'Новый', backgroundColor: '#73787a' },
  OPEN: { label: 'Открыт', backgroundColor: '#2b9db8' },
  ASSIGNED: { label: 'Назначен', backgroundColor: '#2b9db8' },
  IN_PROGRESS: { label: 'В работе', backgroundColor: '#2b9db8' },
  OFFER_SENT: { label: 'Предложение отправлено', backgroundColor: '#d97706' },
  QUOTED: { label: 'Предложение готово', backgroundColor: '#d97706' },
  WON: { label: 'Выигран', backgroundColor: '#16a34a' },
  LOST: { label: 'Проигран', backgroundColor: '#73787a' },
  EXPIRED: { label: 'Просрочен', backgroundColor: '#ba1a1a' },
  CLOSED: { label: 'Закрыт', backgroundColor: '#73787a' },
  CONVERTED: { label: 'Конвертирован', backgroundColor: '#e5e7eb', textColor: '#4b5563' },
  DELETED: { label: 'Удалено', backgroundColor: '#e5e7eb', textColor: '#4b5563' },
};

const OFFER_CONFIG: StatusChipConfig = {
  DRAFT: { label: 'Черновик', backgroundColor: '#73787a' },
  NEW: { label: 'Новое', backgroundColor: '#73787a' },
  OPEN: { label: 'Открыто', backgroundColor: '#2b9db8' },
  SENT: { label: 'Отправлено', backgroundColor: '#d97706' },
  OFFER_SENT: { label: 'Предложение отправлено', backgroundColor: '#d97706' },
  VIEWED: { label: 'Просмотрено', backgroundColor: '#d97706' },
  ACCEPTED: { label: 'Принято', backgroundColor: '#16a34a' },
  WON: { label: 'Выиграно', backgroundColor: '#16a34a' },
  REJECTED: { label: 'Отклонено', backgroundColor: '#ba1a1a' },
  LOST: { label: 'Проиграно', backgroundColor: '#73787a' },
  EXPIRED: { label: 'Просрочено', backgroundColor: '#ba1a1a' },
  CANCELLED: { label: 'Отменено', backgroundColor: '#73787a' },
  CLOSED: { label: 'Закрыто', backgroundColor: '#73787a' },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-badge',
  imports: [StatusChipComponent],
  template: `<app-status-chip [config]="config()" [status]="status()" />`,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input<string | null | undefined>(null);
  readonly variant = input<StatusBadgeVariant>('generic');

  protected readonly config = computed((): StatusChipConfig => {
    switch (this.variant()) {
      case 'lead':
        return LEAD_CONFIG;
      case 'offer':
        return OFFER_CONFIG;
      default:
        return {};
    }
  });
}
