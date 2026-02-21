import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { OrganizationStateService } from '../services/organization-state.service';

export const appGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const orgState = inject(OrganizationStateService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }
  if (!orgState.getActiveOrganization()) {
    return router.createUrlTree(['/onboarding/check']);
  }
  return true;
};
