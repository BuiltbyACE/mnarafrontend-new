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
  {
    path: 'inventory',
    loadComponent: () =>
      import('./components/inventory-overview/inventory-overview').then((m) => m.InventoryOverviewComponent),
  },
  {
    path: 'parents',
    loadComponent: () =>
      import('./components/parents/parent-directory').then((m) => m.ParentDirectoryComponent),
  },
  {
    path: 'parents/:id',
    loadComponent: () =>
      import('./components/parents/parent-detail').then((m) => m.ParentDetailComponent),
  },
];
