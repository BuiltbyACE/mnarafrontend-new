import { Route } from '@angular/router';

export const transportRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/fleet-map/fleet-map').then((m) => m.FleetMapComponent),
  },
];
