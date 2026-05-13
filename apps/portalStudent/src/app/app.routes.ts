import { Route } from '@angular/router';
import { authGuard } from '@sms/core/auth';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./remote-entry/entry.routes').then((m) => m.remoteRoutes),
  },
];
