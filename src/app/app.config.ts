import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeAppCheck, provideAppCheck, ReCaptchaEnterpriseProvider } from '@angular/fire/app-check';
import { Auth, connectAuthEmulator, getAuth, provideAuth as provideAuth_alias } from '@angular/fire/auth';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import {
  provideAuth,
  StsConfigLoader,
  StsConfigStaticLoader,
  withAppInitializerAuthCheck,
} from 'angular-auth-oidc-client';
import { providePrimeNG } from 'primeng/config';

import { buildAngularAuthConfig, UserScope } from '@logto/angular';
import Aura from '@primeuix/themes/aura';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { errorHandlerInterceptor, orgAuthInterceptor } from './interceptors/index';

const connectLocalAuthEmulator = (auth: Auth, host: string, port: number) => {
  connectAuthEmulator(auth, `http://${host}:${port}`);
};

const EMULATORS_HOST = 'localhost';

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
    provideRouter(routes, withComponentInputBinding()),
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
    provideFirebaseApp(() => initializeApp(environment.firebaseOptions)),
    provideAuth_alias(() => {
      const auth = getAuth();

      if (isDevMode()) {
        connectLocalAuthEmulator(auth, EMULATORS_HOST, 9099);
      }

      return auth;
    }),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideAppCheck(() => {
      // TODO get a reCAPTCHA Enterprise here https://console.cloud.google.com/security/recaptcha?project=_
      const provider = new ReCaptchaEnterpriseProvider(environment.reCaptchaKey);
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
    }),
  ],
};
