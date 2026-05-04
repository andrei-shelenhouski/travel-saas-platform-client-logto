import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
  NEW: $localize`:@@requestStatusNew:New`,
  OPEN: $localize`:@@requestStatusOpen:Open`,
  IN_PROGRESS: $localize`:@@requestStatusInProgress:In progress`,
  QUOTED: $localize`:@@requestStatusQuoted:Quoted`,
  WON: $localize`:@@requestStatusWon:Won`,
  LOST: $localize`:@@requestStatusLost:Lost`,
  EXPIRED: $localize`:@@requestStatusExpired:Expired`,
  CLOSED: $localize`:@@requestStatusClosed:Closed`,
};

@Component({
  selector: 'app-request-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-status-chip.html',
  styleUrl: './request-status-chip.scss',
})
export class RequestStatusChipComponent {
  readonly status = input<string | null | undefined>(null);

  label(): string {
    const status = this.status();

    if (!status) {
      return '—';
    }

    return REQUEST_STATUS_LABELS[status] ?? status;
  }

  backgroundColor(): string {
    const status = this.status();

    if (!status) {
      return '#e5e7eb';
    }

    return REQUEST_STATUS_COLORS[status] ?? '#73787a';
  }

  textColor(): string {
    const status = this.status();

    if (!status || !(status in REQUEST_STATUS_COLORS)) {
      return '#1f2937';
    }

    return '#ffffff';
  }
}
