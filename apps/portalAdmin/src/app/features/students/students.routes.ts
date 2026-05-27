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
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/admissions-list/admissions-list').then((m) => m.AdmissionsListComponent),
  },
  {
    path: 'admissions/new',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/admission-wizard/admission-wizard').then((m) => m.AdmissionWizardComponent),
  },
  {
    path: 'promote',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/promote-students/promote-students').then((m) => m.PromoteStudentsComponent),
  },
  {
    path: 'categories',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/student-categories/student-categories').then((m) => m.StudentCategoriesComponent),
  },
  {
    path: 'houses',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/student-houses/student-houses').then((m) => m.StudentHousesComponent),
  },
  {
    path: ':id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/student-detail/student-detail').then((m) => m.StudentDetailComponent),
  },
  {
    path: ':id/commitment',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/behaviour-commitment-form/behaviour-commitment-form').then((m) => m.BehaviourCommitmentFormComponent),
  },
];
