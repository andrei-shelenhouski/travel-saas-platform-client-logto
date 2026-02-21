import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div
      class="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center"
    >
      <div class="text-center text-white">
        <div class="animate-pulse mb-4">
          <svg
            class="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <p class="text-xl font-medium">Completing sign in...</p>
      </div>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.oidcSecurityService
      .checkAuth()
      .pipe(take(1))
      .subscribe(({ isAuthenticated }) => {
        this.router.navigate([isAuthenticated ? '/dashboard' : '/']);
      });
  }
}
