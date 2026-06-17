/**
 * Authentication Guard
 * Protects routes from unauthenticated access using functional approach
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/**
 * Permission Guard Factory
 * Use in routes: canActivate: [permissionGuard('some.permission')]
 */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (authStore.hasPermission(permission)) {
      return true;
    }

    const portalRoute = authStore.getPortalRoute();
    return router.parseUrl(portalRoute ?? '/login');
  };
}
