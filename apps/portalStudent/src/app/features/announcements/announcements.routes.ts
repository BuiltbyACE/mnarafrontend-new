import { Route } from '@angular/router';

export const announcementsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/announcements.component').then((m) => m.AnnouncementsComponent),
  },
];
