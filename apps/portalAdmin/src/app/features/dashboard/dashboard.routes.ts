import { Route } from '@angular/router';

export const dashboardRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal-dashboard/principal-dashboard.component').then(
        (m) => m.PrincipalDashboardComponent
      ),
  },
];