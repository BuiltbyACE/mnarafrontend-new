import { Route } from '@angular/router';

export const academicsRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'classrooms',
    pathMatch: 'full',
  },
  {
    path: 'departments',
    loadComponent: () =>
      import('./components/departments/departments-list.component').then((m) => m.DepartmentsListComponent),
  },
  {
    path: 'key-stages',
    loadComponent: () =>
      import('./components/key-stages/key-stages-list.component').then((m) => m.KeyStagesListComponent),
  },
  {
    path: 'year-levels',
    loadComponent: () =>
      import('./components/year-levels/year-levels-list.component').then((m) => m.YearLevelsListComponent),
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./components/subjects/subjects-list.component').then((m) => m.SubjectsListComponent),
  },
  {
    path: 'classrooms',
    loadComponent: () =>
      import('./components/classrooms/classrooms-list.component').then((m) => m.ClassroomsListComponent),
  },
  {
    path: 'subject-offerings',
    loadComponent: () =>
      import('./components/subject-offerings/subject-offerings-list.component').then((m) => m.SubjectOfferingsListComponent),
  },
  {
    path: 'qualifications',
    loadComponent: () =>
      import('./components/qualifications/qualifications-page.component').then((m) => m.QualificationsPageComponent),
  },
];
