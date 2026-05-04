import { Route } from '@angular/router';

export const studentsRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/students-overview/students-overview').then((m) => m.StudentsOverviewComponent),
  },
  {
    path: 'admissions',
    loadComponent: () =>
      import('./components/admissions-list/admissions-list').then((m) => m.AdmissionsListComponent),
  },
  {
    path: 'promote',
    loadComponent: () =>
      import('./components/promote-students/promote-students').then((m) => m.PromoteStudentsComponent),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./components/student-categories/student-categories').then((m) => m.StudentCategoriesComponent),
  },
  {
    path: 'houses',
    loadComponent: () =>
      import('./components/student-houses/student-houses').then((m) => m.StudentHousesComponent),
  },
];
