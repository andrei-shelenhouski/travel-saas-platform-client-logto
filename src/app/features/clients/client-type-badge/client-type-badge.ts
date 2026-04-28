import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ClientType } from '@app/shared/models';

const BADGE_CONFIG: Record<string, { label: string; classes: string }> = {
  [ClientType.INDIVIDUAL]: {
    label: 'Individual',
    classes: 'bg-blue-100 text-blue-800',
  },
  [ClientType.COMPANY]: {
    label: 'Company',
    classes: 'bg-purple-100 text-purple-800',
  },
  [ClientType.B2B_AGENT]: {
    label: 'B2B Agent',
    classes: 'bg-orange-100 text-orange-800',
  },
};

const FALLBACK = { label: '—', classes: 'bg-gray-100 text-gray-600' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-type-badge',
  template: `
    <span
      class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class]="config().classes"
      >{{ config().label }}</span
    >
  `,
})
export class ClientTypeBadgeComponent {
  readonly type = input.required<string>();

  readonly config = computed(() => BADGE_CONFIG[this.type()] ?? FALLBACK);
}
