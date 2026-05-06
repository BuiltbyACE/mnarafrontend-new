import { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
  },
];
