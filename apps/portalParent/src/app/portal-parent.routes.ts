import { Route } from '@angular/router';
import { ParentLayoutComponent } from './core/layout/parent-layout.component';
import { ParentDashboardComponent } from './features/dashboard/components/parent-dashboard.component';
import { AcademicHubComponent } from './features/academics/components/academic-hub.component';
import { FinanceHubComponent } from './features/finance/components/finance-hub.component';
import { LogisticsHubComponent } from './features/logistics/components/logistics-hub.component';
import { BroadcastsComponent } from './features/communication/broadcasts/broadcasts.component';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: ParentLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: ParentDashboardComponent,
      },
      {
        path: 'academics',
        component: AcademicHubComponent,
        children: [
          {
            path: 'report-cards',
            loadComponent: () =>
              import('./features/academics/report-cards/report-cards.component').then(
                (m) => m.ReportCardsComponent
              ),
          },
          {
            path: 'assignments',
            loadComponent: () =>
              import('./features/academics/assignments/assignments.component').then(
                (m) => m.AssignmentsComponent
              ),
          },
          {
            path: 'timetable',
            loadComponent: () =>
              import('./features/academics/timetable/parent-timetable.component').then(
                (m) => m.ParentTimetableComponent
              ),
          },
        ],
      },
      {
        path: 'finance',
        component: FinanceHubComponent,
        children: [
          {
            path: 'statement',
            loadComponent: () =>
              import('./features/finance/statement/statement.component').then(
                (m) => m.StatementComponent
              ),
          },
          {
            path: 'pay-now',
            loadComponent: () =>
              import('./features/finance/pay-now/pay-now.component').then(
                (m) => m.PayNowComponent
              ),
          },
          {
            path: 'receipts',
            loadComponent: () =>
              import('./features/finance/receipts/receipts.component').then(
                (m) => m.ReceiptsComponent
              ),
          },
        ],
      },
      {
        path: 'logistics',
        component: LogisticsHubComponent,
        children: [
          {
            path: 'attendance',
            loadComponent: () =>
              import('./features/logistics/attendance/attendance.component').then(
                (m) => m.AttendanceComponent
              ),
          },
          {
            path: 'bus-tracking',
            loadComponent: () =>
              import('./features/logistics/bus-tracking/bus-tracking.component').then(
                (m) => m.BusTrackingComponent
              ),
          },
          {
            path: 'report-absence',
            loadComponent: () =>
              import('./features/logistics/report-absence/report-absence.component').then(
                (m) => m.ReportAbsenceComponent
              ),
          },
        ],
      },
      {
        path: 'communication',
        component: BroadcastsComponent,
        children: [
          {
            path: 'broadcasts',
            loadComponent: () =>
              import('./features/communication/broadcasts/broadcasts.component').then(
                (m) => m.BroadcastsComponent
              ),
          },
          {
            path: 'conferences',
            loadComponent: () =>
              import('./features/communication/conferences/conferences.component').then(
                (m) => m.ConferencesComponent
              ),
          },
        ],
      },
    ],
  },
];