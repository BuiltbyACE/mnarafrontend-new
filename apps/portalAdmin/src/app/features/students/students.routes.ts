import { Route } from '@angular/router';

export const studentsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admissions-list/admissions-list').then((m) => m.AdmissionsListComponent),
  },
];
