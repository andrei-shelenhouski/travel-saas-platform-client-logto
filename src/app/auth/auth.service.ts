import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { OidcSecurityService } from 'angular-auth-oidc-client';

import { UserInfoResponse } from '@logto/angular';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly checkAuth$ = this.oidcSecurityService.checkAuth();
  private readonly checkAuth = toSignal(this.checkAuth$);

  readonly isAuthenticated = toSignal(this.oidcSecurityService.isAuthenticated$);
  readonly userData = computed(() => {
    const isAuthenticated = this.isAuthenticated();
    if (!isAuthenticated) return null;

    return this.checkAuth()?.userData as UserInfoResponse | null;
  });
  readonly idToken = computed(() => {
    const isAuthenticated = this.isAuthenticated();
    if (!isAuthenticated) return null;

    return this.checkAuth()?.idToken ?? null;
  });
  readonly accessToken = computed(() => {
    const isAuthenticated = this.isAuthenticated();
    if (!isAuthenticated) return null;

    return this.checkAuth()?.accessToken ?? null;
  });

  signIn(): void {
    this.oidcSecurityService.authorize();
  }

  signOut(): void {
    this.oidcSecurityService.logoff().subscribe(() => {
      console.log('signOut');
    });
  }

  refreshAuth(): void {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      console.log('refreshAuth', isAuthenticated);
    });
  }
}
