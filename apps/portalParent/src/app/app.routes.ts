import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('./portal-parent.routes').then((m) => m.remoteRoutes),
  },
];
