import { Route } from '@angular/router';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { LoginPage } from './core/auth/pages/login-page/login-page';
import { authGuard } from '@sms/core/auth';

export const appRoutes: Route[] = [
  // Public routes - Login
  {
    path: 'login',
    component: LoginPage,
  },

  // -- Canonical portal route paths (used by Omni-Auth redirect) --

  {
    path: 'student',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalStudent/Routes')>('portalStudent/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalAdmin/Routes')>('portalAdmin/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'teacher',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalTeacher/Routes')>('portalTeacher/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'parent',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalParent/Routes')>('portalParent/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'transport',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalTransport/Routes')>(
        'portalTransport/Routes'
      ).then((m) => m?.remoteRoutes ?? []),
  },

  // -- Legacy portal route aliases (backward compatibility) --

  {
    path: 'portalStudent',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalStudent/Routes')>('portalStudent/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'portalAdmin',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalAdmin/Routes')>('portalAdmin/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'portalTeacher',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalTeacher/Routes')>('portalTeacher/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'portalParent',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalParent/Routes')>('portalParent/Routes').then(
        (m) => m?.remoteRoutes ?? []
      ),
  },
  {
    path: 'portalTransport',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalTransport/Routes')>(
        'portalTransport/Routes'
      ).then((m) => m?.remoteRoutes ?? []),
  },

  // Default redirect
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Catch all
  {
    path: '**',
    redirectTo: '/login',
  },
];
