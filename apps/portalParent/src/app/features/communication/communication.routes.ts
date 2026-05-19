import { Route } from '@angular/router';

export const communicationRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'broadcasts',
  },
  {
    path: 'broadcasts',
    loadComponent: () =>
      import('./broadcasts/broadcasts.component').then(
        (m) => m.BroadcastsComponent
      ),
  },
  {
    path: 'conferences',
    loadComponent: () =>
      import('./conferences/conferences.component').then(
        (m) => m.ConferencesComponent
      ),
  },
];