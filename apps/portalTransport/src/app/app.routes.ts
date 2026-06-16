import { Route } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConductorApiService } from './shared/services/conductor-api.service';

/**
 * Device Authentication Guard
 * Redirects unauthenticated devices to login
 */
const deviceAuthGuard = () => {
  const api = inject(ConductorApiService);
  const router = inject(Router);

  if (api.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/device-login.component').then((m) => m.DeviceLoginComponent),
  },
  {
    path: 'operator',
    loadComponent: () =>
      import('./features/trip-operator/trip-operator.component').then((m) => m.TripOperatorComponent),
    canActivate: [deviceAuthGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
