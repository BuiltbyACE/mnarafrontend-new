import { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard-page/dashboard-page').then((m) => m.DashboardPageComponent),
  },
];
