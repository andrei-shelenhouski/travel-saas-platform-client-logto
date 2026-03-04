import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  idToken,
  signInWithRedirect,
  signOut as firebaseSignOut,
  user,
} from '@angular/fire/auth';

interface UserData {
  sub: string;
  email: string | null;
  name: string | null;
  username: string | null;
  picture: string | null;
  roles?: string[];
  custom_data?: Record<string, unknown>;
}

function parseTokenPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = atob(parts[1]);
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly provider = new GoogleAuthProvider();
  private readonly firebaseUser = toSignal(user(this.auth), { initialValue: null });
  private readonly firebaseIdToken = toSignal(idToken(this.auth), { initialValue: null });

  readonly isAuthenticated = computed(() => !!this.firebaseUser());

  readonly userData = computed<UserData | null>(() => {
    const firebaseUser = this.firebaseUser();
    if (!firebaseUser) return null;

    const claims = parseTokenPayload(this.firebaseIdToken());
    const customData = claims?.['custom_data'];
    const rolesClaim = claims?.['roles'];
    const roles = Array.isArray(rolesClaim)
      ? rolesClaim.filter((r): r is string => typeof r === 'string')
      : undefined;

    return {
      sub: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      username: firebaseUser.displayName,
      picture: firebaseUser.photoURL,
      roles,
      custom_data:
        customData && typeof customData === 'object'
          ? (customData as Record<string, unknown>)
          : undefined,
    };
  });

  readonly idToken = computed(() => {
    if (!this.isAuthenticated()) return null;
    return this.firebaseIdToken() ?? null;
  });

  readonly accessToken = computed(() => {
    if (!this.isAuthenticated()) return null;
    return this.firebaseIdToken() ?? null;
  });

  signIn(): void {
    this.provider.setCustomParameters({ prompt: 'select_account' });
    void signInWithRedirect(this.auth, this.provider);
  }

  signOut(): void {
    void firebaseSignOut(this.auth);
  }

  refreshAuth(): void {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;
    void currentUser.getIdToken(true);
  }
}
