import { Route } from '@angular/router';

export const logisticsRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'attendance',
  },
  {
    path: 'attendance',
    loadComponent: () =>
      import('./attendance/attendance.component').then(
        (m) => m.AttendanceComponent
      ),
  },
  {
    path: 'bus-tracking',
    loadComponent: () =>
      import('./bus-tracking/bus-tracking.component').then(
        (m) => m.BusTrackingComponent
      ),
  },
  {
    path: 'report-absence',
    loadComponent: () =>
      import('./report-absence/report-absence.component').then(
        (m) => m.ReportAbsenceComponent
      ),
  },
];