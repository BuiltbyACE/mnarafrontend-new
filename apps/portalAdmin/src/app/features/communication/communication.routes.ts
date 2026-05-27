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
        redirectTo: 'chat',
        pathMatch: 'full',
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('@sms/shared/communication').then(
            (m) => m.ChatHubComponent
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
        redirectTo: 'chat',
      },
    ],
  },
];
