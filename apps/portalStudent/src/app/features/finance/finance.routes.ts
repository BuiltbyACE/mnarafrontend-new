import { Route } from '@angular/router';

export const financeRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/finance.component').then((m) => m.FinanceComponent),
  },
];
