import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, filter, switchMap, take } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { MeService } from '../../services/me.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css',
})
export class CallbackComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly meService = inject(MeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.oidcSecurityService
      .checkAuth()
      .pipe(
        take(1),
        switchMap(({ isAuthenticated }) => {
          if (!isAuthenticated) {
            this.router.navigate(['/']);
            return EMPTY;
          }
          return this.oidcSecurityService.getAccessToken().pipe(
            filter((token): token is string => !!token),
            take(1),
            switchMap(() => this.meService.getMe().pipe(take(1)))
          );
        })
      )
      .subscribe({
        next: () => this.router.navigate(['/onboarding/check']),
        error: () => this.router.navigate(['/']),
      });
  }
}
