import { Route } from '@angular/router';
import { DeviceLoginComponent } from '../features/login/device-login.component';
import { TripOperatorComponent } from '../features/trip-operator/trip-operator.component';

export const remoteRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: DeviceLoginComponent },
  { path: 'operator', component: TripOperatorComponent },
];
