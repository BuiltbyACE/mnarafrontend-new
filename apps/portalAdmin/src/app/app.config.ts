import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { appRoutes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authInterceptorFn, adminErrorInterceptorFn } from '@sms/core/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideStore(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptorFn, adminErrorInterceptorFn])),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
  ],
};
