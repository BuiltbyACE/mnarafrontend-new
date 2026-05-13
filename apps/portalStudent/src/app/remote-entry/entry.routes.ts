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
        path: 'assignments',
        loadChildren: () =>
          import('../features/assignments/assignments.routes').then((m) => m.assignmentRoutes),
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
        path: 'grades',
        loadChildren: () =>
          import('../features/grades/grades.routes').then((m) => m.gradesRoutes),
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
        path: 'resources',
        loadChildren: () =>
          import('../features/resources/resources.routes').then((m) => m.resourcesRoutes),
      },
      {
        path: 'elearning',
        loadChildren: () =>
          import('../features/elearning/elearning.routes').then((m) => m.elearningRoutes),
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
    ],
  },
];
