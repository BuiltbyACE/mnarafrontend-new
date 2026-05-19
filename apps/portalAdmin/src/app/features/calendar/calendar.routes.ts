import { Route } from '@angular/router';

export const calendarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/calendar-manager.component').then(
        (m) => m.AdminCalendarManagerComponent,
      ),
  },
];