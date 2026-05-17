import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  signOut as firebaseSignOut,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithPopup,
  user,
} from '@angular/fire/auth';

import { catchError, from, of, switchMap } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';

import type { Permission } from '@app/shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly provider = new GoogleAuthProvider();
  private readonly meService = inject(MeService);
  private readonly organizationStateService = inject(OrganizationStateService);
  readonly firebaseUser = toSignal(user(this.auth), { initialValue: null });
  private readonly firebaseIdTokenResult = toSignal(
    user(this.auth).pipe(
      switchMap((u) => (u ? from(getIdTokenResult(u)).pipe(catchError(() => of(null))) : of(null))),
    ),
    { initialValue: null },
  );

  readonly isAuthenticated = computed(() => !!this.firebaseUser());

  /** Resolves once Firebase has settled the initial auth state. */
  async whenReady(): Promise<void> {
    await this.auth.authStateReady();
  }

  /**
   * Waits for Firebase to finish restoring persisted auth, then returns whether a user is signed in.
   * Route guards should use this instead of `whenReady()` + `isAuthenticated()`: the latter reads
   * `toSignal(user(...))`, which can still be null for a tick after `authStateReady()` (zoneless CD).
   */
  async hasAuthenticatedUser(): Promise<boolean> {
    await this.auth.authStateReady();

    return this.auth.currentUser !== null;
  }

  async signIn(): Promise<void> {
    this.provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(this.auth, this.provider);
  }

  signOut(): Promise<void> {
    return firebaseSignOut(this.auth);
  }

  hasPermission(permission: Permission): boolean {
    const meData = this.meService.getMeData();
    const activeOrganizationId = this.organizationStateService.getActiveOrganization();

    if (!meData || !activeOrganizationId) {
      return false;
    }

    const activeOrganization = meData.organizations.find(
      (organization) => organization.organizationId === activeOrganizationId,
    );

    if (!activeOrganization) {
      return false;
    }

    return activeOrganization.permissions?.has(permission) ?? false;
  }
}
