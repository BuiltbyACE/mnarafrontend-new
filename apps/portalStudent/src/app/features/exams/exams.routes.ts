import { Route } from '@angular/router';

export const examsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/exam-results.component').then((m) => m.ExamResultsComponent),
  },
];
