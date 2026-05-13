import { Route } from '@angular/router';

export const elearningRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/elearning.component').then((m) => m.ElearningComponent),
  },
];
