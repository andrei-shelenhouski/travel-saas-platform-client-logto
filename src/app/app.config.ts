import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import {
  provideAuth,
  StsConfigLoader,
  StsConfigStaticLoader,
  withAppInitializerAuthCheck,
} from 'angular-auth-oidc-client';

import { buildAngularAuthConfig, UserScope } from '@logto/angular';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { orgAuthInterceptor, errorHandlerInterceptor } from './interceptors/index';

function authConfigLoaderFactory(localeId: string): StsConfigLoader {
  const isProduction = !isDevMode();
  const redirectUri = isProduction
    ? `${environment.origin}/${localeId}/callback`
    : `${environment.origin}/callback`;
  const postLogoutRedirectUri = isProduction
    ? `${environment.origin}/${localeId}`
    : environment.origin;
  const config = buildAngularAuthConfig({
    endpoint: environment.endPoint,
    appId: environment.appId,
    scopes: [
      UserScope.Organizations,
      UserScope.Profile,
      UserScope.Email,
      UserScope.Roles,
      'urn:logto:scope:organizations', // Required for organization_id in token
      environment.resourceScope, // API Resource Scope
    ],
    redirectUri,
    postLogoutRedirectUri,
    includeReservedScopes: true,
    resource: environment.resource ?? '',
  });
  return new StsConfigStaticLoader(config);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([orgAuthInterceptor, errorHandlerInterceptor])),
    provideAuth(
      {
        loader: {
          provide: StsConfigLoader,
          useFactory: authConfigLoaderFactory,
          deps: [LOCALE_ID],
        },
      },
      withAppInitializerAuthCheck(),
    ),
  ],
};
