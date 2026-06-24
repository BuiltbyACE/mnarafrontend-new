import { Route } from '@angular/router';
import { FinanceLayoutComponent } from './layout/finance-layout';

export const financeRoutes: Route[] = [
  {
    path: '',
    component: FinanceLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/finance-dashboard').then((m) => m.FinanceDashboardComponent),
      },
      {
        path: 'receivables',
        loadComponent: () =>
          import('./pages/receivables/receivables-hub').then((m) => m.ReceivablesHubComponent),
      },
      {
        path: 'allocations',
        loadComponent: () =>
          import('./pages/allocations/allocations').then((m) => m.AllocationsComponent),
      },
      {
        path: 'payables',
        loadComponent: () => import('./pages/payables/payables-hub').then(m => m.PayablesHubComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reporting-dashboard').then(m => m.ReportingDashboardComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/staff/payroll-hub').then(m => m.PayrollHubComponent)
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./pages/students/student-finance').then((m) => m.StudentFinanceComponent),
      },
      {
        path: 'staff',
        loadComponent: () => import('./pages/staff/staff-directory').then(m => m.StaffDirectoryComponent),
      },
      {
        path: 'staff/:id',
        loadComponent: () => import('./pages/staff/staff-detail').then(m => m.StaffDetailComponent),
      },
      {
        path: 'parents',
        loadComponent: () => import('./pages/parents/parent-directory').then(m => m.ParentDirectoryComponent),
      },
      {
        path: 'parents/:id',
        loadComponent: () => import('./pages/parents/parent-detail').then(m => m.ParentDetailComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory-hub').then((m) => m.InventoryHubComponent),
      },
      {
        path: 'ledger',
        loadComponent: () =>
          import('./pages/ledger/immutable-ledger').then((m) => m.ImmutableLedgerComponent),
      },
      {
        path: 'chart-of-accounts',
        loadComponent: () =>
          import('./pages/ledger/chart-of-accounts').then((m) => m.ChartOfAccountsComponent),
      },
      {
        path: 'waivers',
        loadComponent: () => import('./pages/waivers/waivers').then(m => m.WaiversComponent),
      },
      {
        path: 'mpesa-transactions',
        loadComponent: () => import('./pages/mpesa-transactions/mpesa-transactions').then(m => m.MpesaTransactionsComponent),
      },
      {
        path: 'fee-categories',
        loadComponent: () => import('./pages/fee-categories/fee-categories').then(m => m.FeeCategoriesComponent),
      },
    ],
  },
];
