import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

const STORAGE_KEY_ID = 'activeOrganizationId';
const STORAGE_KEY_NAME = 'activeOrganizationName';

@Injectable({ providedIn: 'root' })
export class OrganizationStateService {
  private readonly activeOrganizationId = signal<string | null>(this.readIdFromStorage());
  private readonly activeOrganizationName = signal<string | null>(this.readNameFromStorage());

  /** Observable of current active organization id (null if none). */
  readonly activeOrganization$: Observable<string | null> = toObservable(
    this.activeOrganizationId
  );

  getActiveOrganization(): string | null {
    return this.activeOrganizationId();
  }

  getActiveOrganizationName(): string | null {
    return this.activeOrganizationName();
  }

  setActiveOrganization(orgId: string, name?: string): void {
    this.activeOrganizationId.set(orgId);
    this.activeOrganizationName.set(name ?? null);
    localStorage.setItem(STORAGE_KEY_ID, orgId);
    if (name != null) localStorage.setItem(STORAGE_KEY_NAME, name);
    else localStorage.removeItem(STORAGE_KEY_NAME);
  }

  clear(): void {
    this.activeOrganizationId.set(null);
    this.activeOrganizationName.set(null);
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_NAME);
  }

  private readIdFromStorage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_ID);
  }

  private readNameFromStorage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_NAME);
  }
}
