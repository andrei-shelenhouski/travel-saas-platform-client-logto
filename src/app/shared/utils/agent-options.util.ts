import { computed, Signal } from '@angular/core';

import type { OrganizationMemberResponseDto } from '@app/shared/models';

export type AgentOption = {
  id: string;
  name: string;
};

/**
 * Returns a computed signal of sales-agent options derived from the given
 * members signal. A member qualifies when they are active and hold the
 * AGENT, SALES_AGENT, or ADMIN role. Results are sorted alphabetically by
 * name using the Russian locale.
 */
export function computeAgentOptions(
  members: Signal<OrganizationMemberResponseDto[]>,
): Signal<AgentOption[]> {
  return computed(() =>
    members()
      .filter((member) => {
        const role = member.role;

        return member.active && (role === 'AGENT' || role === 'SALES_AGENT' || role === 'ADMIN');
      })
      .map((member) => ({ id: member.userId, name: member.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  );
}
