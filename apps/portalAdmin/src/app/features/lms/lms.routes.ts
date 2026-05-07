import { Routes } from '@angular/router';

export const lmsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'scheduling',
    pathMatch: 'full'
  },
  {
    path: 'scheduling',
    loadComponent: () => import('./components/scheduling-hub/scheduling-hub.component').then(m => m.SchedulingHubComponent)
  },
  {
    path: 'examinations',
    loadComponent: () => import('./components/examinations-hub/examinations-hub.component').then(m => m.ExaminationsHubComponent)
  },
  {
    path: 'operations',
    loadComponent: () => import('./components/operations-hub/operations-hub.component').then(m => m.OperationsHubComponent)
  },
  {
    path: '**',
    redirectTo: 'scheduling'
  }
];
