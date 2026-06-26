import { Route } from '@angular/router';
import { StudentLayoutComponent } from '../core/layout/student-layout.component';
import { authGuard } from '@sms/core/auth';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: StudentLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/dashboard/student-dashboard.component').then(
            (m) => m.StudentDashboardComponent
          ),
      },
      {
        path: 'classes',
        loadChildren: () =>
          import('../features/classes/classes.routes').then((m) => m.classesRoutes),
      },
      {
        path: 'exams',
        loadChildren: () =>
          import('../features/exams/exams.routes').then((m) => m.examsRoutes),
      },
      {
        path: 'timetable',
        loadChildren: () =>
          import('../features/timetable/timetable.routes').then((m) => m.timetableRoutes),
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('../features/attendance/attendance.routes').then((m) => m.attendanceRoutes),
      },
      {
        path: 'announcements',
        loadChildren: () =>
          import('../features/announcements/announcements.routes').then((m) => m.announcementsRoutes),
      },

      {
        path: 'clubs',
        loadChildren: () =>
          import('../features/clubs/clubs.routes').then((m) => m.clubsRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('../features/profile/profile.routes').then((m) => m.profileRoutes),
      },
      {
        path: 'finance',
        loadChildren: () =>
          import('../features/finance/finance.routes').then((m) => m.financeRoutes),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('../features/calendar/calendar.component').then(
            (m) => m.CalendarComponent
          ),
      },
    ],
  },
];
