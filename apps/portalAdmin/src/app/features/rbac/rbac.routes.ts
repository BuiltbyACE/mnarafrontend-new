import { Route } from '@angular/router';

export const rbacRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/users-list/users-list').then((m) => m.UsersListComponent),
  },
];
