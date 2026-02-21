import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { UserInfoResponse } from '@logto/angular';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly checkAuth$ = this.oidcSecurityService.checkAuth();
  private readonly checkAuth = toSignal(this.checkAuth$);

  readonly isAuthenticated = linkedSignal(
    () => this.checkAuth()?.isAuthenticated ?? false
  );
  readonly userData = computed(
    () => this.checkAuth()?.userData as UserInfoResponse | null
  );
  readonly idToken = computed(() => this.checkAuth()?.idToken ?? null);
  readonly accessToken = computed(() => this.checkAuth()?.accessToken ?? null);

  signIn(): void {
    this.oidcSecurityService.authorize();
  }

  signOut(): void {
    this.oidcSecurityService.logoff().subscribe(() => {
      this.isAuthenticated.set(false);
    });
  }
}
