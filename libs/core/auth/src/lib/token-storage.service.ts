/**
 * Token Storage Service
 * Manages JWT tokens in localStorage
 */

import { Injectable } from '@angular/core';
import type { Tokens, UserContext } from '@sms/shared/models';

const ACCESS_TOKEN_KEY = 'mnara_access_token';
const REFRESH_TOKEN_KEY = 'mnara_refresh_token';
const USER_CONTEXT_KEY = 'mnara_user_context';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  /**
   * Save both access and refresh tokens
   */
  saveTokens(tokens: Tokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if tokens exist
   */
  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  /**
   * Save user context to localStorage
   */
  saveUserContext(userContext: UserContext): void {
    localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(userContext));
  }

  /**
   * Get user context from localStorage
   */
  getUserContext(): UserContext | null {
    const data = localStorage.getItem(USER_CONTEXT_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserContext;
    } catch {
      return null;
    }
  }

  /**
   * Clear user context (logout)
   */
  clearUserContext(): void {
    localStorage.removeItem(USER_CONTEXT_KEY);
  }

  /**
   * Clear all stored data (logout)
   */
  clearAll(): void {
    this.clearTokens();
    this.clearUserContext();
  }
}
