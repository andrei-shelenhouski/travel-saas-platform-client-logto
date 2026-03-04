import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { MeService } from '../services/me.service';
import { RoleService } from './role.service';

/**
 * Role-based permissions for UI (hide/disable convert, delete) and list filtering.
 * Admin: full access. Manager: convert + delete. Agent: no convert, no delete, filter to own.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly roleService = inject(RoleService);
  private readonly authService = inject(AuthService);
  private readonly meService = inject(MeService);

  readonly isAdmin = computed(() => this.roleService.isAdmin());
  readonly isAgent = computed(() => this.roleService.isAgent());

  /** Current user ID (from GET /api/me id). Used for "own records" filter and managerId. */
  readonly currentUserId = computed(() => {
    const me = this.meService.getMeData();

    return me?.id;
  });

  /** Can convert lead to client. Admin + Manager only. */
  readonly canConvertLead = computed(() => {
    const r = this.roleService.roleOrDefault();
    return r === 'Admin' || r === 'Manager';
  });

  /** Can delete offers. Admin + Manager; Agent cannot. */
  readonly canDeleteOffer = computed(() => {
    const r = this.roleService.roleOrDefault();
    return r === 'Admin' || r === 'Manager';
  });

  /** Can delete leads. Admin + Manager; Agent cannot. */
  readonly canDeleteLead = computed(() => {
    const r = this.roleService.roleOrDefault();
    return r === 'Admin' || r === 'Manager';
  });

  /** Can delete bookings. Admin + Manager; Agent cannot. */
  readonly canDeleteBooking = computed(() => {
    const r = this.roleService.roleOrDefault();
    return r === 'Admin' || r === 'Manager';
  });

  /** Can delete invoices. Admin + Manager; Agent cannot. */
  readonly canDeleteInvoice = computed(() => {
    const r = this.roleService.roleOrDefault();
    return r === 'Admin' || r === 'Manager';
  });

  /** Whether to filter lists to current user's records (e.g. requests by managerId). */
  readonly filterToOwnRecords = computed(() => this.roleService.isAgent());

  readonly roleLabel = computed(() => {
    const r = this.roleService.roleOrDefault();
    return r === 'Admin' ? 'Admin' : r === 'Agent' ? 'Agent' : 'Manager';
  });
}
