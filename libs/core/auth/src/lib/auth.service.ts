/**
 * Authentication Service
 * Handles all authentication API calls
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  LoginRequest,
  LoginResponse,
  UserContext,
  RefreshRequest,
  Tokens,
} from '@sms/shared/models';
import { environment, getApiUrl } from '@sms/core/config';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);

  /**
   * Login with credentials
   */
  login(credentials: LoginRequest): Observable<Tokens> {
    console.log('Login request to:', getApiUrl(environment.authEndpoints.login));
    return this.http
      .post<LoginResponse>(getApiUrl(environment.authEndpoints.login), credentials)
      .pipe(
        map((response) => {
          console.log('Login successful, tokens received');
          return {
            access: response.access,
            refresh: response.refresh,
          };
        }),
        catchError((error) => {
          console.error('Login error:', error);
          if (error.status === 401) {
            return throwError(
              () => new Error('Invalid credentials. Please try again.')
            );
          }
          if (error.status === 403) {
            return throwError(
              () => new Error('Account is inactive or suspended.')
            );
          }
          const message = error.error?.message || error.error?.detail || 'Login failed. Please try again later.';
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Fetch user context after login
   */
  fetchUserContext(): Observable<UserContext> {
    const accessToken = this.tokenStorage.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('No access token available'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    console.log('Fetch user context from:', getApiUrl(environment.authEndpoints.me));
    return this.http
      .get<UserContext>(getApiUrl(environment.authEndpoints.me), { headers })
      .pipe(
        map((response) => {
          console.log('User context fetched successfully:', response);
          return response;
        }),
        catchError((error) => {
          console.error('Fetch user context error:', error);
          if (error.status === 401) {
            return throwError(() => new Error('Session expired. Please login again.'));
          }
          // Extract backend error message if available
          const message = error.error?.message || error.error?.detail || error.message || 'Failed to fetch user context';
          return throwError(() => new Error(`Failed to fetch user context: ${message}`));
        })
      );
  }

  /**
   * Silent token refresh
   */
  refreshToken(): Observable<Tokens> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshRequest = { refresh: refreshToken };

    return this.http
      .post<Tokens>(getApiUrl(environment.authEndpoints.refresh), request)
      .pipe(
        catchError(() => {
          return throwError(
            () => new Error('Session expired. Please login again.')
          );
        })
      );
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  /**
   * Complete logout
   */
  logout(): void {
    this.tokenStorage.clearTokens();
  }

  /**
   * Check if user is potentially authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenStorage.hasTokens() && !this.isTokenExpired();
  }
}
