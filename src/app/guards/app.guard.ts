import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';
import { OrganizationStateService } from '@app/services/organization-state.service';

export const appGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const orgState = inject(OrganizationStateService);
  const router = inject(Router);
  const isAuthenticated = await auth.hasAuthenticatedUser();

  if (!isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  if (!orgState.getActiveOrganization()) {
    return router.createUrlTree(['/onboarding/check']);
  }

  return true;
};
