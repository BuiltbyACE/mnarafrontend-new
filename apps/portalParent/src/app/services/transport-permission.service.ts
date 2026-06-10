import { Injectable, inject } from '@angular/core';
import { AuthService } from '@sms/core/auth';
import { hasPermission } from '@sms/shared/models';
import { Observable, of, map, catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransportPermissionService {
  private readonly authService = inject(AuthService);

  hasConfigFleetPermission(): Observable<boolean> {
    return this.authService.fetchUserContext().pipe(
      map((userContext) => hasPermission(userContext.permissions, 'config_fleet')),
      catchError(() => of(false))
    );
  }
}