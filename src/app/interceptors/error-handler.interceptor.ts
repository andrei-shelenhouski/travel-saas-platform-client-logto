import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { OrganizationStateService } from '../services/organization-state.service';
import { MeService } from '../services/me.service';
import { ToastService } from '../shared/services/toast.service';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function errorHandlerInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const auth = inject(AuthService);
  const orgState = inject(OrganizationStateService);
  const meService = inject(MeService);
  const router = inject(Router);
  const toast = inject(ToastService);

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
        return throwError(() => err);
      }
      // Global user feedback for server/network errors (5xx, 0, undefined)
      if (status == null || status >= 500) {
        const message = err.error?.message ?? err.message;
        toast.showError(message && String(message).trim() ? String(message) : GENERIC_ERROR_MESSAGE);
      }
      return throwError(() => err);
    }),
  );
}
