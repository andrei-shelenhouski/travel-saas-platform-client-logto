import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, idToken } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { switchMap, take, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { OrganizationStateService } from '../services/organization-state.service';

const API_BASE = environment.baseUrl;
const SKIP_ORG_PATTERNS = [
  { url: '/api/me', method: 'GET' },
  { url: '/api/organizations', method: 'POST' },
];

function shouldSkipOrgHeader(req: HttpRequest<unknown>): boolean {
  const url = req.url.replace(API_BASE, '') || req.url;
  return SKIP_ORG_PATTERNS.some((p) => url.includes(p.url) && req.method === p.method);
}

export function orgAuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
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
