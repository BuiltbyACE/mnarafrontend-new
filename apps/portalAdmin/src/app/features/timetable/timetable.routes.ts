import { Routes } from '@angular/router';

export const timetableRoutes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // === Primary Pages ===
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/timetable-dashboard/timetable-dashboard.page').then((m) => m.TimetableDashboardPage),
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./pages/timetable-editor/timetable-editor.page').then((m) => m.TimetableEditorPage),
  },
  {
    path: 'conflicts',
    loadComponent: () =>
      import('./pages/conflict-report/conflict-report.page').then((m) => m.ConflictReportPage),
  },

  // === Versions ===
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

  // === Audit Log ===
  {
    path: 'audit',
    loadComponent: () =>
      import('./pages/audit-timeline/audit-timeline.page').then((m) => m.AuditTimelinePage),
  },

  // === Setup (reference data) ===
  {
    path: 'setup',
    children: [
      { path: '', redirectTo: 'rooms', pathMatch: 'full' },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./pages/rooms/rooms.page').then((m) => m.RoomsPage),
      },
      {
        path: 'subject-codes',
        loadComponent: () =>
          import('./pages/subject-codes/subject-codes.page').then((m) => m.SubjectCodesPage),
      },
      {
        path: 'bell-schedules',
        loadComponent: () =>
          import('./pages/bell-schedules/bell-schedules.page').then((m) => m.BellSchedulesPage),
      },
    ],
  },

  // === Legacy redirects (backward compatibility) ===
  { path: 'overview', redirectTo: 'dashboard' },
  { path: 'view', redirectTo: 'dashboard' },
  { path: 'admin', redirectTo: 'editor' },
  { path: 'rooms', redirectTo: 'setup/rooms' },
  { path: 'subject-codes', redirectTo: 'setup/subject-codes' },
  { path: 'bell-schedules', redirectTo: 'setup/bell-schedules' },

  // === Staff Locator (kept as-is) ===
  {
    path: 'staff-locator',
    loadComponent: () =>
      import('./pages/staff-locator/staff-locator.page').then((m) => m.StaffLocatorPage),
  },

  // Catch-all
  { path: '**', redirectTo: 'dashboard' },
];
