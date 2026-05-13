import { Route } from '@angular/router';

export const timetableRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/timetable.component').then((m) => m.TimetableComponent),
  },
];
