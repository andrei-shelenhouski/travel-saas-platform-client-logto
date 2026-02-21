import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAuth } from 'angular-auth-oidc-client';

import { buildAngularAuthConfig, UserScope } from '@logto/angular';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAuth({
      config: buildAngularAuthConfig({
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
        redirectUri: environment.origin + '/callback',
        postLogoutRedirectUri: environment.origin,
        includeReservedScopes: true,
        resource: environment.resource ?? '',
        // See https://docs.logto.io/sdk/angular/ for more information
        // resource: 'https://default.logto.app/api'
      }),
    }),
  ],
};
