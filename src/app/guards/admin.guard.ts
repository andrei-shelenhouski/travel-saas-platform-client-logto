import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PermissionService } from '../services/permission.service';

export const adminGuard: CanActivateFn = () => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  if (permissions.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard']);
};
