import { Route } from '@angular/router';

export const profileRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/profile.component').then((m) => m.ProfileComponent),
  },
];
