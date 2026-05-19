import { Route } from '@angular/router';

export const academicsRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'report-cards',
  },
  {
    path: 'report-cards',
    loadComponent: () =>
      import('./report-cards/report-cards.component').then(
        (m) => m.ReportCardsComponent
      ),
  },
  {
    path: 'assignments',
    loadComponent: () =>
      import('./assignments/assignments.component').then(
        (m) => m.AssignmentsComponent
      ),
  },
  {
    path: 'timetable',
    loadComponent: () =>
      import('./timetable/parent-timetable.component').then(
        (m) => m.ParentTimetableComponent
      ),
  },
];