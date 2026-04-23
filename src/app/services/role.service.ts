import { computed, inject, Injectable } from '@angular/core';

import { OrgRole } from '@app/shared/models';
import { MeService } from './me.service';
import { OrganizationStateService } from './organization-state.service';

import type { AppRole } from '@app/shared/models';

function orgRoleToAppRole(role: string): AppRole | string {
  switch (role) {
    case OrgRole.ADMIN:
      return 'Admin';
    case OrgRole.MANAGER:
      return 'Manager';
    case OrgRole.AGENT:
      return 'Agent';
    default:
      return role;
  }
}

/**
 * Resolves current user's app role from GET /api/me (per-organization role).
 * Defaults to Manager when unknown.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);

  readonly role = computed<AppRole | string | null>(() => {
    const me = this.meService.getMeData();
    const activeOrgId = this.orgState.getActiveOrganization();

    if (me?.organizations && activeOrgId) {
      const org = me.organizations.find((o) => o.organizationId === activeOrgId);

      if (org?.role) {
        return orgRoleToAppRole(org.role);
      }
    }

    return null;
  });

  readonly roleOrDefault = computed<AppRole | string>(() => this.role() ?? 'Manager');

  isAdmin(): boolean {
    return this.roleOrDefault() === 'Admin';
  }

  isAgent(): boolean {
    return this.roleOrDefault() === 'Agent';
  }

  isManager(): boolean {
    return this.roleOrDefault() === 'Manager';
  }
}
