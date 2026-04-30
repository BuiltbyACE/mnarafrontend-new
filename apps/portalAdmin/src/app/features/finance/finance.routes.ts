import { Route } from '@angular/router';

export const financeRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/fee-balances/fee-balances').then((m) => m.FeeBalancesComponent),
  },
];
