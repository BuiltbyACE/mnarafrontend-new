import { Route } from '@angular/router';

export const elearningRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/elearning-layout.component').then((m) => m.ElearningLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/elearning-dashboard/elearning-dashboard.component').then(
            (m) => m.ElearningDashboardComponent
          ),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./components/assignments/assignments.component').then(
            (m) => m.AssignmentsComponent
          ),
      },
      {
        path: 'grades',
        loadComponent: () =>
          import('./components/grades/grades.component').then((m) => m.GradesComponent),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./components/resources/resources.component').then((m) => m.ResourcesComponent),
      },
      {
        path: 'live',
        loadComponent: () =>
          import('./components/live-classes/live-classes.component').then(
            (m) => m.LiveClassesComponent
          ),
      },

    ],
  },
];
