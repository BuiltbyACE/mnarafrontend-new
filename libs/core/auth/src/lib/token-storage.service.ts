/**
 * Token Storage Service
 * Manages JWT tokens in sessionStorage (tab-isolated).
 * Each browser tab gets its own token storage, preventing
 * cross-tab/cross-user session corruption across portals.
 */

import { Injectable } from '@angular/core';
import type { Tokens, UserContext } from '@sms/shared/models';

const ACCESS_TOKEN_KEY = 'mnara_access_token';
const REFRESH_TOKEN_KEY = 'mnara_refresh_token';
const USER_CONTEXT_KEY = 'mnara_user_context';

const storage = sessionStorage;

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  saveTokens(tokens: Tokens): void {
    storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  getAccessToken(): string | null {
    return storage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return storage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  saveUserContext(userContext: UserContext): void {
    storage.setItem(USER_CONTEXT_KEY, JSON.stringify(userContext));
  }

  getUserContext(): UserContext | null {
    const data = storage.getItem(USER_CONTEXT_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserContext;
    } catch {
      return null;
    }
  }

  clearUserContext(): void {
    storage.removeItem(USER_CONTEXT_KEY);
  }

  clearAll(): void {
    this.clearTokens();
    this.clearUserContext();
  }
}
