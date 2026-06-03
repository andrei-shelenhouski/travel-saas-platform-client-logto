import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { catchError, Observable, throwError } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function errorHandlerInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const orgState = inject(OrganizationStateService);
  const meService = inject(MeService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err) => {
      const status = err.status ?? err.statusCode;

      if (status === 401) {
        // Token might have expired or been revoked.
        void router.navigate(['/login']);

        return throwError(() => err);
      }

      if (status === 400 || status === 403) {
        const message = err.error?.message ?? err.message;

        if (status === 403 && req.url.includes('/api/leads')) {
          void router.navigate(['/app/dashboard']);

          return throwError(() => err);
        }

        if (message?.toLowerCase().includes('organization')) {
          orgState.clear();
          meService.clearMeData();
          void router.navigate(['/onboarding/check']);
        }

        return throwError(() => err);
      }

      // Global user feedback for server/network errors (5xx, 0, undefined)
      if (status === undefined || status === null || status >= 500) {
        const message = err.error?.message ?? err.message;
        snackBar.open(
          message && String(message).trim() ? String(message) : GENERIC_ERROR_MESSAGE,
          'Close',
          { duration: 5000 },
        );
      }

      return throwError(() => err);
    }),
  );
}
