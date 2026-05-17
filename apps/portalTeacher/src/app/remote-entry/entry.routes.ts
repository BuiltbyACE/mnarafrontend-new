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
          import('../features/dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
      },
      {
        path: 'classes',
        loadComponent: () =>
          import('../features/classes/classes.component').then(m => m.ClassesComponent),
      },
      {
        path: 'timetable',
        loadComponent: () =>
          import('../features/timetable/timetable.component').then(m => m.TimetableComponent),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('../features/attendance/attendance.component').then(m => m.AttendanceComponent),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('../features/assignments/assignments.component').then(m => m.AssignmentsComponent),
      },
      {
        path: 'grading',
        loadComponent: () =>
          import('../features/grading/grading.component').then(m => m.GradingComponent),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('../features/resources/resources.component').then(m => m.ResourcesComponent),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('../features/students/students.component').then(m => m.StudentsComponent),
      },
      {
        path: 'behaviour',
        loadComponent: () =>
          import('../features/behaviour/behaviour.component').then(m => m.BehaviourComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('../features/messages/messages.component').then(m => m.MessagesComponent),
      },
      {
        path: 'announcements',
        loadComponent: () =>
          import('../features/announcements/announcements.component').then(m => m.AnnouncementsComponent),
      },
      {
        path: 'meetings',
        loadComponent: () =>
          import('../features/meetings/meetings.component').then(m => m.MeetingsComponent),
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
        path: 'notifications',
        loadComponent: () =>
          import('../features/notifications/notifications.component').then(m => m.NotificationsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../features/settings/settings.component').then(m => m.SettingsComponent),
      },
    ],
  },
];
