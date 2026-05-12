import { Route } from '@angular/router';

export const communicationRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/communication-layout/communication-layout').then(
        (m) => m.CommunicationLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'broadcasts',
        pathMatch: 'full',
      },
      {
        path: 'broadcasts',
        loadComponent: () =>
          import('./components/broadcast-list/broadcast-list').then(
            (m) => m.BroadcastListComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/communication-dashboard').then(
            (m) => m.CommunicationDashboardComponent
          ),
      },
      {
        path: 'conversations',
        loadComponent: () =>
          import('./components/conversations/conversation-list').then(
            (m) => m.ConversationListComponent
          ),
      },
      {
        path: 'engagement',
        loadComponent: () =>
          import('./components/engagement/engagement-metrics').then(
            (m) => m.EngagementMetricsComponent
          ),
      },
      {
        path: 'meetings',
        loadComponent: () =>
          import('./components/meetings/meeting-manager').then(
            (m) => m.MeetingManagerComponent
          ),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./components/support/support-escalations').then(
            (m) => m.SupportEscalationsComponent
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/analytics/communication-analytics').then(
            (m) => m.CommunicationAnalyticsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/communication-settings').then(
            (m) => m.CommunicationSettingsComponent
          ),
      },
      {
        path: '**',
        redirectTo: 'broadcasts',
      },
    ],
  },
];
