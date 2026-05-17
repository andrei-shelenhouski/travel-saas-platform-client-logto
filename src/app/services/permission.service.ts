import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';
import { PermissionKey } from '@app/shared/models';

import { OrganizationStateService } from './organization-state.service';
import { orgRoleToLabel } from './role.service';

/**
 * Centralized permission-key checks for UI visibility and action gating.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly authService = inject(AuthService);
  private readonly meService = inject(MeService);
  private readonly orgState = inject(OrganizationStateService);

  readonly canUpdateSettings = computed(() =>
    this.authService.hasPermission(PermissionKey.SETTINGS_UPDATE),
  );
  readonly canInviteMembers = computed(() =>
    this.authService.hasPermission(PermissionKey.MEMBERS_INVITE),
  );
  readonly canViewRoles = computed(() => this.authService.hasPermission(PermissionKey.ROLES_VIEW));
  readonly canCreateLead = computed(() =>
    this.authService.hasPermission(PermissionKey.LEADS_CREATE),
  );
  readonly canAssignLead = computed(() =>
    this.authService.hasPermission(PermissionKey.LEADS_ASSIGN),
  );
  readonly canViewAllLeads = computed(() =>
    this.authService.hasPermission(PermissionKey.LEADS_VIEW_ALL),
  );
  readonly canCreateOffer = computed(() =>
    this.authService.hasPermission(PermissionKey.OFFERS_CREATE),
  );
  readonly canViewAllOffers = computed(() =>
    this.authService.hasPermission(PermissionKey.OFFERS_VIEW_ALL),
  );
  readonly canViewAllRequests = computed(() =>
    this.authService.hasPermission(PermissionKey.REQUESTS_VIEW_ALL),
  );
  readonly canViewInvoices = computed(() =>
    this.authService.hasPermission(PermissionKey.INVOICES_VIEW),
  );
  readonly canCreateInvoice = computed(() =>
    this.authService.hasPermission(PermissionKey.INVOICES_CREATE),
  );
  readonly canPublishInvoice = computed(() =>
    this.authService.hasPermission(PermissionKey.INVOICES_PUBLISH),
  );
  readonly canRecordInvoicePayment = computed(() =>
    this.authService.hasPermission(PermissionKey.INVOICES_RECORD_PAYMENT),
  );
  readonly canUpdateBookings = computed(() =>
    this.authService.hasPermission(PermissionKey.BOOKINGS_UPDATE),
  );

  readonly isAdmin = computed(() => this.canViewRoles());
  readonly isAgent = computed(() => !this.canViewAllLeads());

  /** Current user ID (from GET /api/me id). Used for "own records" filter and managerId. */
  readonly currentUserId = computed(() => {
    const me = this.meService.getMeData();

    return me?.id;
  });

  /** Backward-compatible alias used by existing components/tests. */
  readonly canConvertLead = computed(() => this.canAssignLead());

  readonly canDeleteOffer = computed(() =>
    this.authService.hasPermission(PermissionKey.OFFERS_DELETE),
  );

  readonly canDeleteLead = computed(() =>
    this.authService.hasPermission(PermissionKey.LEADS_DELETE),
  );

  readonly canDeleteBooking = computed(() =>
    this.authService.hasPermission(PermissionKey.BOOKINGS_DELETE),
  );

  readonly canDeleteInvoice = computed(() =>
    this.authService.hasPermission(PermissionKey.INVOICES_CANCEL),
  );

  /** Whether to filter lists to current user's records (e.g. requests by managerId). */
  readonly filterToOwnRecords = computed(() => !this.canViewAllRequests());

  readonly roleLabel = computed(() => {
    const meData = this.meService.getMeData();
    const activeOrganizationId = this.orgState.getActiveOrganization();
    const fallbackRole = this.orgState.getActiveOrganizationRole();

    if (!meData || !activeOrganizationId) {
      return fallbackRole ? orgRoleToLabel(fallbackRole) : 'Manager';
    }

    const activeOrganization = meData.organizations.find(
      (organization) => organization.organizationId === activeOrganizationId,
    );

    if (!activeOrganization) {
      return fallbackRole ? orgRoleToLabel(fallbackRole) : 'Manager';
    }

    const roleName = activeOrganization.roleName?.trim();

    if (roleName) {
      return roleName;
    }

    if (activeOrganization.role) {
      return orgRoleToLabel(activeOrganization.role);
    }

    return fallbackRole ? orgRoleToLabel(fallbackRole) : 'Manager';
  });
}
