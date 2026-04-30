import { Route } from '@angular/router';

export const academicsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/classrooms-list/classrooms-list').then((m) => m.ClassroomsListComponent),
  },
];
