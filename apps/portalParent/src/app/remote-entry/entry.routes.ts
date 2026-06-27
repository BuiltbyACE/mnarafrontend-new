import { Route } from '@angular/router';
import { RemoteEntry } from './entry';
import { remoteRoutes as portalRoutes } from '../portal-parent.routes';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntry,
    children: portalRoutes[0]?.children || [],
  },
];
