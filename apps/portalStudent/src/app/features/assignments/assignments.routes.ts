import { Route } from '@angular/router';

export const assignmentRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/assignments.component').then((m) => m.AssignmentsComponent),
  },
];
