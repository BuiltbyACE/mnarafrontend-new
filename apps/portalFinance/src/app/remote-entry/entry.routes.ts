import { Route } from '@angular/router';
import { portalGuard } from '@sms/core/auth';

export const remoteRoutes: Route[] = [
  {
    path: '',
    canActivate: [portalGuard('FINANCE')],
    loadChildren: () => import('../finance.routes').then((m) => m.financeRoutes),
  },
];
