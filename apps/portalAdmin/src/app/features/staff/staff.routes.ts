import { Route } from '@angular/router';

export const staffRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/faculty-list/faculty-list').then((m) => m.FacultyListComponent),
  },
];
