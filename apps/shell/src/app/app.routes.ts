import { Route } from '@angular/router';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { LoginPage } from './core/auth/pages/login-page/login-page';
import { authGuard } from '@sms/core/auth';

type RemoteRoutes = { remoteRoutes: Route[] };

const loadPortal = (name: string) => () =>
  loadRemote<RemoteRoutes>(name)
    .then((m) => m!.remoteRoutes)
    .catch(() => []);

export const appRoutes: Route[] = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalAdmin/Routes'),
  },
  {
    path: 'student',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalStudent/Routes'),
  },
  {
    path: 'teacher',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalTeacher/Routes'),
  },
  {
    path: 'parent',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalParent/Routes'),
  },
  {
    path: 'transport',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalTransport/Routes'),
  },
  {
    path: 'portalAdmin',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalAdmin/Routes'),
  },
  {
    path: 'portalStudent',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalStudent/Routes'),
  },
  {
    path: 'portalTeacher',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalTeacher/Routes'),
  },
  {
    path: 'portalParent',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalParent/Routes'),
  },
  {
    path: 'portalTransport',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalTransport/Routes'),
  },
  {
    path: 'finance',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalFinance/Routes'),
  },
  {
    path: 'portalFinance',
    canActivate: [authGuard],
    loadChildren: loadPortal('portalFinance/Routes'),
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];