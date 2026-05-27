import { Route } from '@angular/router';
import { authGuard } from '@sms/core/auth';

export const remoteRoutes: Route[] = [
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('../finance.routes').then((m) => m.financeRoutes),
  },
];
