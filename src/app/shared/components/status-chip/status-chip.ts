import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusChipConfig = Record<
  string,
  { label: string; backgroundColor: string; textColor?: string }
>;

@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="status-chip"
      [style.background-color]="backgroundColor()"
      [style.color]="textColor()"
    >
      {{ label() }}
    </span>
  `,
  styles: `
    .status-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      line-height: 1rem;
      font-weight: 500;
    }
  `,
})
export class StatusChipComponent {
  readonly status = input<string | null | undefined>(null);
  readonly config = input.required<StatusChipConfig>();

  protected readonly label = computed((): string => {
    const status = this.status();

    if (!status) {
      return '—';
    }

    return this.config()[status]?.label ?? status;
  });

  protected readonly backgroundColor = computed((): string => {
    const status = this.status();

    if (!status) {
      return '#e5e7eb';
    }

    return this.config()[status]?.backgroundColor ?? '#73787a';
  });

  protected readonly textColor = computed((): string => {
    const status = this.status();

    if (!status || !(status in this.config())) {
      return '#1f2937';
    }

    return this.config()[status].textColor ?? '#ffffff';
  });
}
