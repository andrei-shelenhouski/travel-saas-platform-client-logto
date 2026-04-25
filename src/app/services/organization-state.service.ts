import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import type { OrgRole } from '@app/shared/models';

const STORAGE_KEY_ID = 'plus_active_org_id';
const STORAGE_KEY_NAME = 'activeOrganizationName';
const STORAGE_KEY_ROLE = 'activeOrganizationRole';

@Injectable({ providedIn: 'root' })
export class OrganizationStateService {
  private readonly activeOrganizationId = signal<string | null>(
    this.readFromStorage(STORAGE_KEY_ID),
  );
  private readonly activeOrganizationName = signal<string | null>(
    this.readFromStorage(STORAGE_KEY_NAME),
  );
  private readonly activeOrganizationRole = signal<OrgRole | string | null>(
    this.readFromStorage(STORAGE_KEY_ROLE),
  );

  /** Observable of current active organization id (null if none). */
  readonly activeOrganization$: Observable<string | null> = toObservable(this.activeOrganizationId);

  getActiveOrganization(): string | null {
    return this.activeOrganizationId();
  }

  getActiveOrganizationName(): string | null {
    return this.activeOrganizationName();
  }

  getActiveOrganizationRole(): OrgRole | string | null {
    return this.activeOrganizationRole();
  }

  setActiveOrganization(orgId: string, name?: string, role?: OrgRole | string): void {
    this.activeOrganizationId.set(orgId);
    this.activeOrganizationName.set(name ?? null);
    this.activeOrganizationRole.set(role ?? null);

    localStorage.setItem(STORAGE_KEY_ID, orgId);

    if (name !== undefined) {
      localStorage.setItem(STORAGE_KEY_NAME, name);
    } else {
      localStorage.removeItem(STORAGE_KEY_NAME);
    }

    if (role !== undefined) {
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
  }

  clear(): void {
    this.activeOrganizationId.set(null);
    this.activeOrganizationName.set(null);
    this.activeOrganizationRole.set(null);
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_NAME);
    localStorage.removeItem(STORAGE_KEY_ROLE);
  }

  private readFromStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }
}
