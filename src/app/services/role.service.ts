import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { MeService } from './me.service';
import { OrganizationStateService } from './organization-state.service';
import type { AppRole } from '../shared/models';
import { OrgRole } from '../shared/models';

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
 * Resolves current user's app role from GET /api/me (per-organization role) or auth token fallback.
 * Defaults to Manager when unknown.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly meService = inject(MeService);
  private readonly authService = inject(AuthService);
  private readonly orgState = inject(OrganizationStateService);

  /** Trigger re-read of role (e.g. after getMe() completes). */
  private readonly refresh = signal(0);

  readonly role = computed<AppRole | string | null>(() => {
    this.refresh();
    const me = this.meService.getMeData();
    const activeOrgId = this.orgState.getActiveOrganization();
    if (me?.organizations && activeOrgId) {
      const org = me.organizations.find((o) => o.id === activeOrgId);
      if (org?.role) return orgRoleToAppRole(org.role);
    }
    const userData = this.authService.userData() as Record<string, unknown> | null;
    const custom = userData?.['custom_data'] as Record<string, unknown> | undefined;
    if (custom?.['role']) return orgRoleToAppRole(String(custom['role']));
    const roles = userData?.['roles'] as string[] | undefined;
    if (roles?.length) return orgRoleToAppRole(roles[0]);
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

  /** Call after getMe() so role from API is picked up. */
  refreshRole(): void {
    this.refresh.update((n) => n + 1);
  }
}
