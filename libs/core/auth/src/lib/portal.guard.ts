/**
 * Portal Guard
 * Handles default route '/' - redirects to appropriate portal or login
 */

import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthStore } from './auth.store';

@Injectable({
  providedIn: 'root',
})
export class PortalGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if we have tokens in storage
    if (this.authStore.tokens()) {
      // If tokens exist but user context not loaded, redirect to login
      if (!this.authStore.user()) {
        return this.router.createUrlTree(['/login']);
      }

      // User is authenticated, redirect to their portal
      const portalRoute = this.authStore.getPortalRoute();
      if (portalRoute) {
        return this.router.createUrlTree([portalRoute]);
      }
    }

    // Not authenticated, redirect to login
    return this.router.createUrlTree(['/login']);
  }
}

/**
 * Public Guard
 * Prevents authenticated users from accessing login pages
 * Redirects to their portal if already logged in
 */
export class PublicGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    // If authenticated, redirect to portal
    if (this.authStore.isAuthenticated() && this.authStore.user()) {
      const portalRoute = this.authStore.getPortalRoute();
      if (portalRoute) {
        return this.router.createUrlTree([portalRoute]);
      }
    }

    // Not authenticated, allow access to public page
    return true;
  }
}

/**
 * Convenience factory for public guard
 */
export function publicGuard() {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (authStore.isAuthenticated() && authStore.user()) {
      const portalRoute = authStore.getPortalRoute();
      if (portalRoute) {
        return router.createUrlTree([portalRoute]);
      }
    }

    return true;
  };
}
