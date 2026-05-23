import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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

@Component({
  selector: 'app-lead-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lead-status-chip.html',
  styleUrl: './lead-status-chip.scss',
})
export class LeadStatusChipComponent {
  readonly status = input<string | null | undefined>(null);

  label(): string {
    const status = this.status();

    if (!status) {
      return '—';
    }

    return LEAD_STATUS_LABELS[status] ?? status;
  }

  backgroundColor(): string {
    const status = this.status();

    if (!status) {
      return '#e5e7eb';
    }

    return LEAD_STATUS_COLORS[status] ?? '#73787a';
  }

  textColor(): string {
    const status = this.status();

    if (!status || !(status in LEAD_STATUS_COLORS)) {
      return '#1f2937';
    }

    return '#ffffff';
  }
}
