import { provideHttpClient, withInterceptors } from '@angular/common/http';
import '@angular/common/locales/global/ru-BY';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
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
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';

import { routes } from '@app/app.routes';
import { NavioTitleStrategy } from '@app/core/navio-title.strategy';
import { errorHandlerInterceptor, orgAuthInterceptor } from '@app/interceptors/index';
import { environment } from '@environments/environment';

const connectLocalAuthEmulator = (auth: Auth, host: string, port: number): void => {
  connectAuthEmulator(auth, `http://${host}:${port}`);
};

const EMULATORS_HOST = 'localhost';

export const appConfig: ApplicationConfig = {
  providers: [
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
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
      },
    },
    { provide: TitleStrategy, useClass: NavioTitleStrategy },
    {
      provide: LOCALE_ID,
      useValue: 'ru-BY',
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'ru-BY',
    },
  ],
};
