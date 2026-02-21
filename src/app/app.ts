import { CommonModule } from '@angular/common';
import { Component, computed, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { OidcSecurityService } from 'angular-auth-oidc-client';

import { UserInfoResponse } from '@logto/angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly checkAuth$ = this.oidcSecurityService.checkAuth();
  private readonly checkAuth = toSignal(this.checkAuth$);

  readonly title = '@logto/angular-sample';
  readonly isAuthenticated = linkedSignal(() => this.checkAuth()?.isAuthenticated ?? false);
  readonly userData = computed(() => this.checkAuth()?.userData as UserInfoResponse | null);
  readonly idToken = computed(() => this.checkAuth()?.idToken ?? null);
  readonly accessToken = computed(() => this.checkAuth()?.accessToken ?? null);

  signIn() {
    this.oidcSecurityService.authorize();
  }

  signOut() {
    this.oidcSecurityService.logoff().subscribe((result) => {
      console.log('app sign-out', result);
      this.isAuthenticated.set(false);
    });
  }
}
