import { Route } from '@angular/router';
import { RemoteEntry } from './entry';
import { portalGuard } from '@sms/core/auth';
import { remoteRoutes as portalRoutes } from '../portal-parent.routes';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntry,
    canActivate: [portalGuard('PARENT')],
    children: portalRoutes[0]?.children || [],
  },
];
