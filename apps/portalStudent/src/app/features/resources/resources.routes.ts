import { Route } from '@angular/router';

export const resourcesRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/resources.component').then((m) => m.ResourcesComponent),
  },
];
