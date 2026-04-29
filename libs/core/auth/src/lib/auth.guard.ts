/**
 * Authentication Guard
 * Protects routes from unauthenticated access
 */

import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthStore } from './auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if authenticated
    if (this.authStore.isAuthenticated()) {
      // Check for required permissions if specified
      const requiredPermission = route.data?.['requiredPermission'] as string | undefined;
      if (requiredPermission) {
        return this.authStore.hasPermission(requiredPermission) || this.router.createUrlTree(['/login']);
      }
      return true;
    }

    // Not authenticated - redirect to login
    return this.router.createUrlTree(['/login']);
  }
}

/**
 * Permission Guard Factory
 * Use in routes: canActivate: [permissionGuard('some.permission')]
 */
export function permissionGuard(permission: string) {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (authStore.hasPermission(permission)) {
      return true;
    }

    // Redirect to their portal or login
    const portalRoute = authStore.getPortalRoute();
    return router.createUrlTree([portalRoute ?? '/login']);
  };
}
