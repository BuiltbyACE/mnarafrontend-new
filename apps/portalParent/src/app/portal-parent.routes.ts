import { Route } from '@angular/router';
import { ParentLayoutComponent } from './core/layout/parent-layout.component';
import { ParentDashboardComponent } from './features/dashboard/components/parent-dashboard.component';
import { AcademicHubComponent } from './features/academics/components/academic-hub.component';
import { FinanceHubComponent } from './features/finance/components/finance-hub.component';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: ParentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // Dashboard
      { path: 'dashboard', component: ParentDashboardComponent },

      // Academics
      {
        path: 'academics',
        component: AcademicHubComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'report-cards' },
          {
            path: 'report-cards',
            loadComponent: () =>
              import('./features/academics/report-cards/report-cards.component').then(m => m.ReportCardsComponent),
          },
        ],
      },

      // Finance
      {
        path: 'finance',
        component: FinanceHubComponent,
      },

      // Fee Statement (standalone page)
      {
        path: 'statement',
        loadComponent: () =>
          import('./features/finance/statement/statement.component').then(m => m.StatementComponent),
      },

      // Fee Structure (standalone page)
      {
        path: 'fee-structure',
        loadComponent: () =>
          import('./features/finance/fee-structure/fee-structure.component').then(m => m.FeeStructureComponent),
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

      // Calendar
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
      },
    ],
  },
];
