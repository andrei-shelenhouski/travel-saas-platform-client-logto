import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  user,
} from '@angular/fire/auth';

import { catchError, from, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly provider = new GoogleAuthProvider();
  readonly firebaseUser = toSignal(user(this.auth), { initialValue: null });
  private readonly firebaseIdTokenResult = toSignal(
    user(this.auth).pipe(
      switchMap((u) => (u ? from(getIdTokenResult(u)).pipe(catchError(() => of(null))) : of(null))),
    ),
    { initialValue: null },
  );

  readonly isAuthenticated = computed(() => !!this.firebaseUser());

  readonly idToken = computed(() => {
    if (!this.isAuthenticated()) return null;
    return this.firebaseIdTokenResult()?.token ?? null;
  });

  /** Resolves once Firebase has settled the initial auth state. */
  async whenReady(): Promise<void> {
    await this.auth.authStateReady();
  }

  signIn(): void {
    this.provider.setCustomParameters({ prompt: 'select_account' });
    void signInWithRedirect(this.auth, this.provider);
  }

  signOut(): void {
    void firebaseSignOut(this.auth);
  }
}
