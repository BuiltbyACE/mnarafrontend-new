import { Route } from '@angular/router';

export const attendanceRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/attendance.component').then((m) => m.AttendanceComponent),
  },
];
