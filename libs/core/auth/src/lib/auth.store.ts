/**
 * Authentication Store
 * Angular Signals-based state management
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import type {
  UserContext,
  Tokens,
  PortalType,
} from '@sms/shared/models';
import { getPortalRoute, hasPermission, portalKeyToPortalType } from '@sms/shared/models';
import { TokenStorageService } from './token-storage.service';

interface AuthState {
  identifier: string;
  user: UserContext | null;
  tokens: Tokens | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private tokenStorage = inject(TokenStorageService);

  // State signals
  private state = signal<AuthState>({
    identifier: '',
    user: null,
    tokens: null,
    isLoading: false,
    error: null,
  });

  // Computed signals
  readonly identifier = computed(() => this.state().identifier);
  readonly user = computed(() => this.state().user);
  readonly tokens = computed(() => this.state().tokens);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly isAuthenticated = computed(() => !!this.state().tokens?.access);
  readonly portalType = computed(() => {
    const key = this.state().user?.portalKey;
    return key ? portalKeyToPortalType(key) : null;
  });
  readonly roleName = computed(() => {
    // Derive role from portalKey (backend doesn't provide role_name directly)
    const key = this.state().user?.portalKey;
    if (!key) return null;
    // Extract role from portalKey (e.g., "student-portal" → "Student")
    const role = key.split('-')[0];
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : null;
  });
  readonly userPermissions = computed(() => this.state().user?.permissions ?? []);
  readonly fullName = computed(() => {
    const userProfile = this.state().user?.user;
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return userProfile?.firstName ?? this.state().identifier;
  });
  readonly isGodMode = computed(() =>
    this.state().user?.permissions?.includes('*') ?? false
  );

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    if (this.isGodMode()) return true;
    return hasPermission(this.userPermissions(), permission);
  }

  /**
   * Get portal route for current user
   */
  getPortalRoute(): string | null {
    const portal = this.portalType();
    return portal ? getPortalRoute(portal as PortalType) : null;
  }

  /**
   * Actions
   */
  setIdentifier(identifier: string): void {
    this.state.update((s) => ({ ...s, identifier }));
  }

  setTokens(tokens: Tokens): void {
    // Save to localStorage for API calls
    this.tokenStorage.saveTokens(tokens);
    // Update signal state
    this.state.update((s) => ({ ...s, tokens }));
  }

  setUserContext(user: UserContext): void {
    // Save to localStorage for cross-module access
    this.tokenStorage.saveUserContext(user);
    // Update signal state
    this.state.update((s) => ({ ...s, user }));
  }

  setLoading(isLoading: boolean): void {
    this.state.update((s) => ({ ...s, isLoading }));
  }

  setError(error: string | null): void {
    this.state.update((s) => ({ ...s, error }));
  }

  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }

  updateTokens(tokens: Tokens): void {
    // Save to localStorage for API calls
    this.tokenStorage.saveTokens(tokens);
    // Update signal state
    this.state.update((s) => ({ ...s, tokens }));
  }

  logout(): void {
    // Clear from localStorage
    this.tokenStorage.clearAll();
    // Reset state
    this.state.set({
      identifier: '',
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
    });
  }

  /**
   * Restore tokens AND user context from localStorage on app startup.
   * Critical for microfrontend remotes which start with a blank AuthStore
   * instance and must re-hydrate from storage before any guard can run.
   */
  restoreFromStorage(): void {
    const access = this.tokenStorage.getAccessToken();
    const refresh = this.tokenStorage.getRefreshToken();
    const userContext = this.tokenStorage.getUserContext();

    this.state.update((s) => ({
      ...s,
      tokens: access && refresh ? { access, refresh } : s.tokens,
      user: userContext ?? s.user,
    }));
  }

  /**
   * @deprecated Use restoreFromStorage() which also restores user context.
   * Kept for backwards compatibility.
   */
  restoreTokensFromStorage(): void {
    this.restoreFromStorage();
  }
}
