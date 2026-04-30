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
import { Observable, of, delay } from 'rxjs';
import { AuthStore } from './auth.store';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // Check tokens from signal state first
    const tokens = this.authStore.tokens();
    const localToken = this.tokenStorage.getAccessToken();
    const hasToken = !!tokens?.access || !!localToken;

    console.log('AuthGuard:', route.routeConfig?.path, 'hasToken:', hasToken, 'tokenFromSignal:', !!tokens?.access, 'tokenFromStorage:', !!localToken);
    console.log('AuthGuard: userPermissions:', this.authStore.userPermissions(), 'isGodMode:', this.authStore.isGodMode());

    if (hasToken) {
      // Check for required permissions if specified
      const requiredPermission = route.data?.['requiredPermission'] as string | undefined;
      console.log('AuthGuard: requiredPermission:', requiredPermission);
      if (requiredPermission) {
        const hasPermission = this.authStore.hasPermission(requiredPermission);
        console.log('AuthGuard: hasPermission result:', hasPermission);
        if (!hasPermission) {
          return of(this.router.createUrlTree(['/login'])).pipe(delay(0));
        }
      }
      console.log('AuthGuard: Allowing access');
      // Return observable with micro-delay to ensure async resolution
      return of(true).pipe(delay(0));
    }

    console.log('AuthGuard: No token - redirecting to login');
    // Not authenticated - redirect to login
    return of(this.router.createUrlTree(['/login'])).pipe(delay(0));
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
