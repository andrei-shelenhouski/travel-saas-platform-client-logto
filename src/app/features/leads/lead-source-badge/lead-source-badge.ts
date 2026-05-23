import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import type { LeadSource } from '@app/shared/models';

type LeadSourceBadgeSize = 'default' | 'compact';

type LeadSourceBadgeConfig = {
  label: string;
  color: string;
  backgroundColor: string;
  icon: string;
};

const SOURCE_BADGE_CONFIG: Record<string, LeadSourceBadgeConfig> = {
  MANUAL: {
    label: 'Вручную',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    icon: 'edit',
  },
  INSTAGRAM_ADS: {
    label: 'Instagram Ads',
    color: '#a3328a',
    backgroundColor: '#fde7f6',
    icon: 'photo_camera',
  },
  TOURVISOR: {
    label: 'TourVisor',
    color: '#0e8a16',
    backgroundColor: '#e8f6ea',
    icon: 'language',
  },
};

@Component({
  selector: 'app-lead-source-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon],
  templateUrl: './lead-source-badge.html',
  styleUrl: './lead-source-badge.scss',
})
export class LeadSourceBadgeComponent {
  readonly source = input<LeadSource | string | null | undefined>(null);
  readonly size = input<LeadSourceBadgeSize>('default');

  protected readonly badge = computed(() => {
    const source = this.source();

    if (!source) {
      return null;
    }

    return SOURCE_BADGE_CONFIG[source] ?? this.buildFallbackBadge(source);
  });

  private buildFallbackBadge(source: string): LeadSourceBadgeConfig {
    return {
      label: this.humanizeSource(source),
      color: '#334155',
      backgroundColor: '#f1f5f9',
      icon: 'link',
    };
  }

  private humanizeSource(source: string): string {
    const normalized = source
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');

    if (normalized.length > 0) {
      return normalized;
    }

    return source;
  }
}
