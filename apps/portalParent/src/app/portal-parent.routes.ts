import { Route } from '@angular/router';
import { ParentLayoutComponent } from './core/layout/parent-layout.component';
import { ParentDashboardComponent } from './features/dashboard/components/parent-dashboard.component';
import { AcademicHubComponent } from './features/academics/components/academic-hub.component';
import { FinanceHubComponent } from './features/finance/components/finance-hub.component';
import { LogisticsHubComponent } from './features/logistics/components/logistics-hub.component';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: ParentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // Dashboard
      { path: 'dashboard', component: ParentDashboardComponent },

      // My Children (student profiles)
      {
        path: 'students',
        loadComponent: () =>
          import('./features/students/my-children.component').then(m => m.MyChildrenComponent),
      },

      // Academics
      {
        path: 'academics',
        component: AcademicHubComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'timetable' },
          {
            path: 'timetable',
            loadComponent: () =>
              import('./features/academics/timetable/parent-timetable.component').then(m => m.ParentTimetableComponent),
          },
          {
            path: 'report-cards',
            loadComponent: () =>
              import('./features/academics/report-cards/report-cards.component').then(m => m.ReportCardsComponent),
          },
          {
            path: 'assignments',
            loadComponent: () =>
              import('./features/academics/assignments/assignments.component').then(m => m.AssignmentsComponent),
          },
        ],
      },

      // Finance
      {
        path: 'finance',
        component: FinanceHubComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'statement' },
          {
            path: 'statement',
            loadComponent: () =>
              import('./features/finance/statement/statement.component').then(m => m.StatementComponent),
          },
          {
            path: 'pay-now',
            loadComponent: () =>
              import('./features/finance/pay-now/pay-now.component').then(m => m.PayNowComponent),
          },
          {
            path: 'receipts',
            loadComponent: () =>
              import('./features/finance/receipts/receipts.component').then(m => m.ReceiptsComponent),
          },
        ],
      },

      // Logistics / Safety & Transport
      {
        path: 'logistics',
        component: LogisticsHubComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'attendance' },
          {
            path: 'attendance',
            loadComponent: () =>
              import('./features/logistics/attendance/attendance.component').then(m => m.AttendanceComponent),
          },
          {
            path: 'bus-tracking',
            loadComponent: () =>
              import('./features/logistics/bus-tracking/bus-tracking.component').then(m => m.BusTrackingComponent),
          },
          {
            path: 'report-absence',
            loadComponent: () =>
              import('./features/logistics/report-absence/report-absence.component').then(m => m.ReportAbsenceComponent),
          },
          {
            path: 'behaviour-records',
            loadComponent: () =>
              import('./features/logistics/behaviour/behaviour-records.component').then(m => m.BehaviourRecordsComponent),
          },
          {
            path: 'behaviour-commitments',
            loadComponent: () =>
              import('./features/logistics/behaviour/behaviour-commitments.component').then(m => m.BehaviourCommitmentsComponent),
          },
        ],
      },

      // Transport
      {
        path: 'transport',
        loadComponent: () =>
          import('./features/transport/transport.component').then(m => m.TransportComponent),
      },

      // Announcements
      {
        path: 'announcements',
        loadComponent: () =>
          import('./features/communication/broadcasts/broadcasts.component').then(m => m.BroadcastsComponent),
      },

      // Notifications
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
      },

      // Communication
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/communication/chat/chat.component').then(m => m.ChatComponent),
      },

      // Calendar
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
      },
    ],
  },
];
