import { Route } from '@angular/router';

export const gradesRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/grades.component').then((m) => m.GradesComponent),
  },
];
