import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { OrganizationStateService } from '../services/organization-state.service';
import { MeService } from '../services/me.service';

export function errorHandlerInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const auth = inject(AuthService);
  const orgState = inject(OrganizationStateService);
  const meService = inject(MeService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      const status = err.status ?? err.statusCode;
      if (status === 401) {
        orgState.clear();
        meService.clearMeData();
        auth.signOut();
        auth.signIn();
        return throwError(() => err);
      }
      if (status === 400 || status === 403) {
        const message = err.error?.message ?? err.message;
        if (message?.toLowerCase().includes('organization') || status === 403) {
          orgState.clear();
          meService.clearMeData();
          router.navigate(['/onboarding/check']);
        }
      }
      return throwError(() => err);
    }),
  );
}
