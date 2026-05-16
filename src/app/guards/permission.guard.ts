import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@app/auth/auth.service';

import type { Permission } from '@app/shared/models';

export const permissionGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredPermission = route.data?.['permission'] as Permission | undefined;

  await auth.whenReady();

  if (!requiredPermission || auth.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/app/dashboard']);
};
