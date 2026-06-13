import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { MeService } from '@app/services/me.service';

import type { Permission } from '@app/shared/models';

export const permissionGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const meService = inject(MeService);
  const router = inject(Router);
  const requiredPermission = route.data?.['permission'] as Permission | undefined;

  await auth.whenReady();

  // On direct URL navigation the MainLayoutComponent has not yet been instantiated,
  // so MeService may not have fetched /api/me yet. Fetch it now if needed so that
  // hasPermission() has the data it needs to evaluate correctly.
  if (!meService.getMeData()) {
    try {
      await firstValueFrom(meService.getMe());
    } catch {
      // /api/me failed (network error, 401, etc.) — fall through to the permission
      // check below; hasPermission() will return false on null meData and the guard
      // will redirect to dashboard, which is the safest fallback.
    }
  }

  if (!requiredPermission || auth.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/app/dashboard']);
};
