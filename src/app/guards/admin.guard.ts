import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../services/permission.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const permissions = inject(PermissionService);
  const router = inject(Router);

  await auth.whenReady();

  if (permissions.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard']);
};
