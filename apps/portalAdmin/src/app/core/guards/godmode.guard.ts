/**
 * GodMode Guard
 * Validates user has GodMode permissions (permissions: ["*"])
 * Required for Admin Portal access
 */

import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthStore } from '@sms/core/auth';

@Injectable({
  providedIn: 'root',
})
export class GodModeGuard implements CanActivate {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    // Hydrate state from localStorage in case this is a fresh remote context.
    this.authStore.restoreFromStorage();
    return this.authStore.userPermissions().includes('*')
      ? of(true)
      : this.checkGodMode();
  }

  private checkGodMode(): Observable<boolean | UrlTree> {
    return new Observable<boolean | UrlTree>((observer) => {
      const permissions = this.authStore.userPermissions();
      const isGodMode = permissions.includes('*');

      if (isGodMode) {
        observer.next(true);
        observer.complete();
      } else if (this.authStore.isAuthenticated()) {
        // Authenticated but not GodMode - redirect to unauthorized
        observer.next(this.router.createUrlTree(['/unauthorized']));
        observer.complete();
      } else {
        // Not authenticated - redirect to login
        observer.next(this.router.createUrlTree(['/login']));
        observer.complete();
      }
    });
  }

  /**
   * Check if user has GodMode (for use in components)
   */
  static isGodMode(permissions: string[]): boolean {
    return permissions.includes('*');
  }

  /**
   * Check specific permission (bypasses if GodMode)
   */
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(requiredPermission);
  }
}

/**
 * Functional guard for modern Angular.
 *
 * IMPORTANT: The portalAdmin remote runs in its own Angular context, so its
 * AuthStore starts completely blank (user: null, permissions: []).
 * We MUST call restoreFromStorage() before any permission check to hydrate
 * the signal state from localStorage (where the shell stored the user context
 * and tokens after login).
 */
export const godModeGuard = (): Observable<boolean | UrlTree> => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Hydrate the AuthStore signal from localStorage.
  // This is safe to call repeatedly — it is a no-op if data is already in state.
  authStore.restoreFromStorage();

  const permissions = authStore.userPermissions();

  if (permissions.includes('*')) {
    console.log('GodModeGuard: Allowing - has * permission');
    return of(true);
  }

  if (authStore.isAuthenticated()) {
    // Authenticated but lacks god-mode permissions — not an admin.
    console.log('GodModeGuard: Authenticated but not GodMode - redirecting to unauthorized');
    return of(router.createUrlTree(['/unauthorized']));
  }

  // No tokens at all — send to login.
  console.log('GodModeGuard: Not authenticated - redirecting to login');
  return of(router.createUrlTree(['/login']));
};
