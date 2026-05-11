import { Route } from '@angular/router';

export const financeRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'fee-balances',
    loadComponent: () =>
      import('./components/fee-balances/fee-balances').then((m) => m.FeeBalancesComponent),
  },
];
