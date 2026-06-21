import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ClientRole, ClientType } from '@app/shared/models';

const BADGE_CONFIG: Record<string, { label: string; classes: string }> = {
  [ClientType.INDIVIDUAL]: {
    label: 'Физ. лицо',
    classes: 'bg-blue-100 text-blue-800',
  },
  [ClientType.COMPANY]: {
    label: 'Компания',
    classes: 'bg-purple-100 text-purple-800',
  },
  [ClientType.B2B_AGENT]: {
    label: 'B2B агент',
    classes: 'bg-orange-100 text-orange-800',
  },
  [ClientType.AGENT]: {
    label: 'Агент',
    classes: 'bg-yellow-100 text-yellow-800',
  },
  [ClientType.ORGANIZATION]: {
    label: 'Организация',
    classes: 'bg-gray-100 text-gray-600',
  },
};

const ROLE_BADGE_CONFIG: Record<string, { label: string; classes: string }> = {
  [ClientRole.AGENCY]: { label: 'Агентство', classes: 'bg-orange-100 text-orange-800' },
  [ClientRole.OPERATOR]: { label: 'Оператор', classes: 'bg-orange-100 text-orange-800' },
  [ClientRole.DMC]: { label: 'ДМК', classes: 'bg-orange-100 text-orange-800' },
  [ClientRole.CORPORATE]: { label: 'Корпоратив', classes: 'bg-purple-100 text-purple-800' },
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
    @if (extraCount() > 0) {
      <span class="ml-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        +{{ extraCount() }}
      </span>
    }
  `,
})
export class ClientTypeBadgeComponent {
  readonly type = input.required<string>();
  readonly roles = input<string[]>();

  readonly config = computed(() => {
    const type = this.type();
    const roles = this.roles() ?? [];

    if (type === ClientType.ORGANIZATION && roles.length > 0) {
      const primaryRole = roles[0];

      return ROLE_BADGE_CONFIG[primaryRole] ?? BADGE_CONFIG[type] ?? FALLBACK;
    }

    return BADGE_CONFIG[type] ?? FALLBACK;
  });

  readonly extraCount = computed(() => {
    const type = this.type();
    const roles = this.roles() ?? [];

    if (type === ClientType.ORGANIZATION && roles.length > 1) {
      return roles.length - 1;
    }

    return 0;
  });
}
