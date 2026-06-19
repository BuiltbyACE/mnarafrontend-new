import { Routes } from '@angular/router';

export const timetableRoutes: Routes = [
  {
    path: '',
    redirectTo: 'view',
    pathMatch: 'full',
  },
  {
    path: 'view',
    loadComponent: () =>
      import('./pages/timetable-view/timetable-view.page').then((m) => m.TimetableViewPage),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/timetable-admin/timetable-admin.page').then((m) => m.TimetableAdminPage),
  },
  {
    path: 'staff-locator',
    loadComponent: () =>
      import('./pages/staff-locator/staff-locator.page').then((m) => m.StaffLocatorPage),
  },
  {
    path: '**',
    redirectTo: 'view',
  },
];
