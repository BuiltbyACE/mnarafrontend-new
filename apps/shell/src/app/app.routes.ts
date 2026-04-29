import { Route } from '@angular/router';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { DiscoverPage } from './core/auth/pages/discover-page/discover-page';
import { CredentialsPage } from './core/auth/pages/credentials-page/credentials-page';
import { publicGuard, AuthGuard } from '@sms/core/auth';

export const appRoutes: Route[] = [
  // Public routes - Login flow
  {
    path: 'login',
    canActivate: [publicGuard()],
    children: [
      {
        path: '',
        component: DiscoverPage,
      },
      {
        path: 'password',
        component: CredentialsPage,
      },
    ],
  },

  // Protected portal routes
  {
    path: 'portalTransport',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalTransport/Routes')>(
        'portalTransport/Routes',
      ).then((m) => m?.remoteRoutes ?? []),
  },
  {
    path: 'portalParent',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalParent/Routes')>(
        'portalParent/Routes',
      ).then((m) => m?.remoteRoutes ?? []),
  },
  {
    path: 'portalStudent',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalStudent/Routes')>(
        'portalStudent/Routes',
      ).then((m) => m?.remoteRoutes ?? []),
  },
  {
    path: 'portalTeacher',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalTeacher/Routes')>(
        'portalTeacher/Routes',
      ).then((m) => m?.remoteRoutes ?? []),
  },
  {
    path: 'portalAdmin',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemote<typeof import('portalAdmin/Routes')>(
        'portalAdmin/Routes',
      ).then((m) => m?.remoteRoutes ?? []),
  },

  // Default redirect - handled by PortalGuard in future enhancement
  // For now, redirect to login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Catch all - redirect to login
  {
    path: '**',
    redirectTo: '/login',
  },
];
