import { Route } from '@angular/router';
import { RemoteEntry } from './entry';
import { godModeGuard } from '../core/guards/godmode.guard';

/**
 * Admin Portal Routes
 * All routes protected by GodMode guard (permissions: ["*"])
 */
export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntry,
    canActivate: [godModeGuard],
    children: [
      // Dashboard (default route)
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../features/dashboard/components/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPageComponent
          ),
      },
      // Dashboard explicit path
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/dashboard/components/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPageComponent
          ),
      },
      // Academics Module
      {
        path: 'academics',
        loadChildren: () =>
          import('../features/academics/academics.routes').then((m) => m.academicsRoutes),
      },
      // Staff & HR Module
      {
        path: 'staff',
        loadChildren: () =>
          import('../features/staff/staff.routes').then((m) => m.staffRoutes),
      },
      // Students Module
      {
        path: 'students',
        loadChildren: () =>
          import('../features/students/students.routes').then((m) => m.studentsRoutes),
      },
      // Finance Module
      {
        path: 'finance',
        loadChildren: () =>
          import('../features/finance/finance.routes').then((m) => m.financeRoutes),
      },
      // Transport Module
      {
        path: 'transport',
        loadChildren: () =>
          import('../features/transport/transport.routes').then((m) => m.transportRoutes),
      },
      // RBAC System Management
      {
        path: 'rbac',
        loadChildren: () =>
          import('../features/rbac/rbac.routes').then((m) => m.rbacRoutes),
      },
    ],
  },
];
