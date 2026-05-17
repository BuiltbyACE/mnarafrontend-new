import { Route } from '@angular/router';

export const monitoringRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/campus-monitor.component').then((m) => m.CampusMonitorComponent),
  },
];
