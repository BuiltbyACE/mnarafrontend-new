import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { schedulingReducer, SchedulingEffects } from '@sms/domain/scheduling';

export const schedulingRoutes: Routes = [
  {
    path: '',
    providers: [
      provideState({ name: 'scheduling', reducer: schedulingReducer }),
      provideEffects(SchedulingEffects),
    ],
    loadComponent: () =>
      import('@sms/frontend/scheduling-ui').then(m => m.SchedulingWorkspaceComponent),
  },
];
