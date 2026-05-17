import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from '@app/auth/auth.service';
import { OrgRole } from '@app/shared/models';
import { PermissionKey } from '@app/shared/models';
import { MeService } from './me.service';
import { OrganizationStateService } from './organization-state.service';

import type { AppRole } from '@app/shared/models';

export function orgRoleToAppRole(role: string): AppRole | string {
  switch (role) {
    case OrgRole.ADMIN:
      return 'Admin';
    case OrgRole.MANAGER:
      return 'Manager';
    case OrgRole.AGENT:
    case OrgRole.SALES_AGENT:
      return 'Agent';
    case OrgRole.BACK_OFFICE:
      return 'Back Office';
    default:
      return role;
  }
}

/** Human-readable label for display (e.g. in badges). Preserves all role distinctions. */
export function orgRoleToLabel(role: string): string {
  switch (role) {
    case OrgRole.ADMIN:
      return 'Admin';
    case OrgRole.MANAGER:
      return 'Manager';
    case OrgRole.SALES_AGENT:
      return 'Sales Agent';
    case OrgRole.AGENT:
      return 'Agent';
    case OrgRole.BACK_OFFICE:
      return 'Back Office';
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
  private readonly authService = inject(AuthService);
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

    // Fallback to persisted role from localStorage (available before /api/me is fetched)
    const persistedRole = this.orgState.getActiveOrganizationRole();

    if (persistedRole) {
      return orgRoleToAppRole(persistedRole);
    }

    return null;
  });

  /** Raw API role string for the active org (used for display labels in org switcher). */
  readonly rawRole = computed<string | null>(() => {
    const me = this.meService.getMeData();
    const activeOrgId = this.orgState.getActiveOrganization();

    if (me?.organizations && activeOrgId) {
      const org = me.organizations.find((o) => o.organizationId === activeOrgId);

      return org?.role ?? null;
    }

    return this.orgState.getActiveOrganizationRole();
  });

  readonly roleOrDefault = computed<AppRole | string>(() => this.role() ?? 'Manager');

  isAdmin(): boolean {
    return this.authService.hasPermission(PermissionKey.ROLES_VIEW);
  }

  isAgent(): boolean {
    return !this.authService.hasPermission(PermissionKey.LEADS_VIEW_ALL);
  }

  isManager(): boolean {
    return this.authService.hasPermission(PermissionKey.LEADS_ASSIGN);
  }
}
