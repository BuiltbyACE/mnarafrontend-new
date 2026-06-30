import { Route } from '@angular/router';
import { portalGuard } from '@sms/core/auth';
import { TeacherLayoutComponent } from '../core/layout/teacher-layout.component';
import { provideNativeDateAdapter } from '@angular/material/core';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: TeacherLayoutComponent,
    canActivate: [portalGuard('STAFF')],
    providers: [
      provideNativeDateAdapter(),
    ],
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
        path: 'workspace/:id/assignments/:aid',
        loadComponent: () =>
          import('../features/assignments/view/view-assignment.component').then(m => m.ViewAssignmentComponent),
      },
      {
        path: 'workspace/:id/assignments/:aid/edit',
        loadComponent: () =>
          import('../features/assignments/edit/edit-assignment.component').then(m => m.EditAssignmentComponent),
      },
      {
        path: 'assignments/:id',
        loadComponent: () =>
          import('../features/assignments/view/view-assignment.component').then(m => m.ViewAssignmentComponent),
      },
      {
        path: 'assignments/:id/edit',
        loadComponent: () =>
          import('../features/assignments/edit/edit-assignment.component').then(m => m.EditAssignmentComponent),
      },
      {
        path: 'workspace/:id/assignments/:aid/submissions',
        loadComponent: () =>
          import('../features/assignments/submissions/submissions-list.component').then(m => m.SubmissionsListComponent),
      },
      {
        path: 'assignments/:id/submissions',
        loadComponent: () =>
          import('../features/assignments/submissions/submissions-list.component').then(m => m.SubmissionsListComponent),
      },
      {
        path: 'assignments/:id/pipeline',
        loadComponent: () =>
          import('../features/grading/components/grading-pipeline/grading-pipeline.component').then(m => m.GradingPipelineComponent),
      },
      {
        path: 'workspace/:id',
        loadComponent: () =>
          import('../features/classes/components/workspace-detail.component').then(m => m.WorkspaceDetailComponent),
      },
      {
        path: 'workspace/:id/gradebook',
        loadComponent: () =>
          import('../features/classes/components/workspace-detail.component').then(m => m.WorkspaceDetailComponent),
      },
      {
        path: 'grading',
        loadComponent: () =>
          import('../features/grading/components/grading-pipeline/grading-pipeline.component').then(m => m.GradingPipelineComponent),
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
        path: 'attendance',
        loadComponent: () =>
          import('../features/attendance/live-roster.component').then(m => m.LiveRosterComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('../features/messages/messages.component').then(m => m.MessagesComponent),
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
        path: 'exams',
        loadComponent: () =>
          import('../features/exams/exam-list.component').then(m => m.ExamListComponent),
      },
      {
        path: 'exams/:id',
        loadComponent: () =>
          import('../features/exams/exam-detail.component').then(m => m.ExamDetailComponent),
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
