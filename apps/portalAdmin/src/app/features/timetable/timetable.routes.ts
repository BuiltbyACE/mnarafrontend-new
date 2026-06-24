import { Routes } from '@angular/router';

export const timetableRoutes: Routes = [
  {
    path: '',
    redirectTo: 'view',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./pages/timetable-overview/timetable-overview.page').then((m) => m.TimetableOverviewPage),
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
    path: 'versions',
    loadComponent: () =>
      import('./pages/versions/timetable-versions.page').then((m) => m.TimetableVersionsPage),
  },
  {
    path: 'versions/:id',
    loadComponent: () =>
      import('./pages/version-detail/version-detail.page').then((m) => m.VersionDetailPage),
  },
  {
    path: 'versions/:id/compare',
    loadComponent: () =>
      import('./pages/version-compare/version-compare.page').then((m) => m.VersionComparePage),
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./pages/audit-timeline/audit-timeline.page').then((m) => m.AuditTimelinePage),
  },
  {
    path: '**',
    redirectTo: 'view',
  },
];
