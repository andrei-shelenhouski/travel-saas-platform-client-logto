import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, idToken } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { Observable, switchMap, take, throwError } from 'rxjs';

import { environment } from '@environments/environment';
import { OrganizationStateService } from '@app/services/organization-state.service';

const API_BASE = environment.baseUrl;

/** Routes that don't require the X-Organization-Id header. */
function shouldSkipOrgHeader(req: HttpRequest<unknown>): boolean {
  const url = req.url.replace(API_BASE, '');
  // Skip org header for these endpoints
  return (
    (url === '/api/me' && req.method === 'GET') ||
    (url === '/api/organizations' && req.method === 'POST')
  );
}

export function orgAuthInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const auth = inject(Auth);
  const orgState = inject(OrganizationStateService);
  const router = inject(Router);

  return idToken(auth).pipe(
    take(1),
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      const setHeaders: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      const skipOrg = shouldSkipOrgHeader(req);

      if (!skipOrg) {
        const orgId = orgState.getActiveOrganization();
        if (!orgId) {
          router.navigate(['/onboarding/check']);
          return throwError(() => new Error('No active organization'));
        }
        setHeaders['X-Organization-Id'] = orgId;
      }

      return next(req.clone({ setHeaders }));
    }),
  );
}
