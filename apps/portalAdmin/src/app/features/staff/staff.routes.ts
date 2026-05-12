import { Route } from '@angular/router';

export const staffRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/staff-layout/staff-layout').then((m) => m.StaffLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'directory',
        pathMatch: 'full',
      },
      {
        path: 'directory',
        loadComponent: () =>
          import('./components/faculty-list/faculty-list').then((m) => m.FacultyListComponent),
      },
      {
        path: 'leave',
        loadComponent: () =>
          import('./components/leave-management/leave-management').then((m) => m.LeaveManagementComponent),
      },
      {
        path: 'payroll',
        loadComponent: () =>
          import('./components/payroll-summary/payroll-summary').then((m) => m.PayrollSummaryComponent),
      },
    ],
  },
];
