import { Route } from '@angular/router';
import { authGuard } from '@sms/core/auth';
import { TeacherLayoutComponent } from '../core/layout/teacher-layout.component';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: TeacherLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/dashboard/components/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'classes',
        loadComponent: () =>
          import('../features/classes/components/classes-list.component').then(m => m.ClassesListComponent),
      },
      {
        path: 'workspace/:id/assignments/create',
        loadComponent: () =>
          import('../features/assignments/create/create-assignment.component').then(m => m.CreateAssignmentComponent),
      },
      {
        path: 'workspace/:id',
        loadComponent: () =>
          import('../features/classes/components/workspace-detail.component').then(m => m.WorkspaceDetailComponent),
      },
      {
        path: 'timetable',
        loadComponent: () =>
          import('../features/timetable/timetable.component').then(m => m.TimetableComponent),
      },

      {
        path: 'resources/upload',
        loadComponent: () =>
          import('../features/resources/upload/upload-resource.component').then(m => m.UploadResourceComponent),
      },

      {
        path: 'behaviour',
        loadComponent: () =>
          import('../features/behaviour/behaviour.component').then(m => m.BehaviourComponent),
      },

      {
        path: 'announcements',
        loadComponent: () =>
          import('../features/announcements/announcements.component').then(m => m.AnnouncementsComponent),
      },

      {
        path: 'hr',
        loadComponent: () =>
          import('../features/hr/hr.component').then(m => m.HrComponent),
      },
      {
        path: 'payslips',
        loadComponent: () =>
          import('../features/payslips/payslips.component').then(m => m.PayslipsComponent),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('../features/calendar/calendar.component').then(m => m.CalendarComponent),
      },

      {
        path: 'settings',
        loadComponent: () =>
          import('../features/settings/settings.component').then(m => m.SettingsComponent),
      },
    ],
  },
];
