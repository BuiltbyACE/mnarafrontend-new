/**
 * Authentication Guard
 * Protects routes from unauthenticated access using functional approach
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const localToken = tokenStorage.getAccessToken();
  const hasToken = !!authStore.tokens()?.access || !!localToken;

  if (hasToken) {
    // Check for required permissions if specified
    const requiredPermission = route.data?.['requiredPermission'] as string | undefined;
    if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
      return router.parseUrl('/login');
    }
    return true;
  }

  // If no token, redirect to login cleanly
  return router.parseUrl('/login');
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
