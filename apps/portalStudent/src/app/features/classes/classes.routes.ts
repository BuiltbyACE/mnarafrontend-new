import { Route } from '@angular/router';

export const classesRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/classes.component').then((m) => m.ClassesComponent),
  },
];
