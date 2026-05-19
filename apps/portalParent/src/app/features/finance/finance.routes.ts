import { Route } from '@angular/router';

export const financeRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'statement',
  },
  {
    path: 'statement',
    loadComponent: () =>
      import('./statement/statement.component').then(
        (m) => m.StatementComponent
      ),
  },
  {
    path: 'pay-now',
    loadComponent: () =>
      import('./pay-now/pay-now.component').then(
        (m) => m.PayNowComponent
      ),
  },
  {
    path: 'receipts',
    loadComponent: () =>
      import('./receipts/receipts.component').then(
        (m) => m.ReceiptsComponent
      ),
  },
];