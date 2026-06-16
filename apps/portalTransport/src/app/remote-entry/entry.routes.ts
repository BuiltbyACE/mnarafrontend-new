import { Route } from '@angular/router';
import { LoginComponent } from '../features/login/login.component';
import { TripOperatorComponent } from '../features/trip-operator/trip-operator.component';

export const remoteRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'operator', component: TripOperatorComponent },
];
