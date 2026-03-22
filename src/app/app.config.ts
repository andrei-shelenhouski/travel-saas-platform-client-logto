import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaEnterpriseProvider,
} from '@angular/fire/app-check';
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  provideAuth as provideFirebaseAuth,
} from '@angular/fire/auth';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { providePrimeNG } from 'primeng/config';

import Aura from '@primeuix/themes/aura';

import { environment } from '@environments/environment';
import { routes } from '@app/app.routes';
import { errorHandlerInterceptor, orgAuthInterceptor } from '@app/interceptors/index';

const connectLocalAuthEmulator = (auth: Auth, host: string, port: number): void => {
  connectAuthEmulator(auth, `http://${host}:${port}`);
};

const EMULATORS_HOST = 'localhost';

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
    provideFirebaseApp(() => initializeApp(environment.firebaseOptions)),
    provideFirebaseAuth(() => {
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
