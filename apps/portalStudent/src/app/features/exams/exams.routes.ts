import { Route } from '@angular/router';

export const examsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/exams.component').then((m) => m.ExamsComponent),
  },
];
