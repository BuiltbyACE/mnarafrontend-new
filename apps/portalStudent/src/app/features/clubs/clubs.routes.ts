import { Route } from '@angular/router';

export const clubsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/clubs.component').then((m) => m.ClubsComponent),
  },
];
