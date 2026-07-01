import { Route } from '@angular/router';

export const monitoringRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/monitoring-layout.component').then((m) => m.MonitoringLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'live',
      },
      {
        path: 'live',
        loadComponent: () =>
          import('./components/campus-monitor.component').then((m) => m.CampusMonitorComponent),
      },
      {
        path: 'unassigned',
        loadComponent: () =>
          import('./components/unassigned-scans.component').then((m) => m.UnassignedScansComponent),
      },
    ],
  },
];
