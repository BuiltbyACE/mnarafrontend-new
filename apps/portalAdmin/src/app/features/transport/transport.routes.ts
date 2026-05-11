import { Route } from '@angular/router';

export const transportRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/transport-dashboard/transport-dashboard.component').then((m) => m.TransportDashboardComponent),
  },
];
