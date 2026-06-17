import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type {
  LoginRequest,
  LoginResponse,
  UserContext,
  RefreshRequest,
  Tokens,
} from '@sms/shared/models';
import { environment, getApiUrl } from '@sms/core/config';
import { TokenStorageService } from './token-storage.service';
import { AuthStore } from './auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  /**
   * Authenticates a user using their credentials and stores the resulting JWT tokens.
   * 
   * This method sends a POST request to the backend login endpoint. Upon success,
   * it intercepts the response to extract the `access` and `refresh` tokens, 
   * storing them securely in the browser's localStorage via `TokenStorageService`.
   * 
   * @param {LoginRequest} credentials - The user's login details (email/phone/id and password).
   * @returns {Observable<LoginResponse>} An observable containing the backend login response payload.
   * @throws {Error} Throws an error if credentials are invalid (401), account inactive (403), or network failure.
   * 
   * @example
   * this.authService.login({ email: 'admin@school.com', password: 'pwd' }).subscribe({
   *   next: (res) => console.log('Login success'),
   *   error: (err) => console.error(err)
   * });
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(getApiUrl(environment.authEndpoints.login), credentials)
      .pipe(
        tap((response) => {
          const raw = response as any;
          const tokens: Tokens = {
            access: raw.access || raw.access_token,
            refresh: raw.refresh || raw.refresh_token,
          };
          this.tokenStorage.saveTokens(tokens);
        }),
        catchError((error) => {
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
          const message =
            error.error?.message ||
            error.error?.detail ||
            'Login failed. Please try again later.';
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Fetches the authenticated user's contextual data from the backend.
   * 
   * This method uses the stored access token to request the `/me/` endpoint.
   * It normalizes the backend response (which can vary based on user role) 
   * into a standardized `UserContext` object required by the frontend portals.
   * 
   * @returns {Observable<UserContext>} An observable containing the normalized user profile and portal permissions.
   * @throws {Error} Throws an error if no token exists, the session expired (401), or the server fails.
   * 
   * @example
   * this.authService.fetchUserContext().subscribe(context => {
   *   console.log('User is in portal:', context.portalKey);
   * });
   */
  fetchUserContext(): Observable<UserContext> {
    const accessToken = this.tokenStorage.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('No access token available'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http
      .get<any>(getApiUrl(environment.authEndpoints.me), { headers })
      .pipe(
        map((response) => {
          const userData = response.data || response;
          const portalKey =
            userData.portalKey ||
            userData.portal ||
            userData.portal_type ||
            userData.portalType ||
            userData.role ||
            userData.user_type ||
            userData.type ||
            'unknown';
          const normalizedContext: UserContext = {
            user: {
              firstName:
                userData.user?.firstName ||
                userData.user?.first_name ||
                userData.firstName ||
                userData.first_name ||
                '',
              lastName:
                userData.user?.lastName ||
                userData.user?.last_name ||
                userData.lastName ||
                userData.last_name ||
                '',
              isActive:
                userData.user?.isActive ??
                userData.user?.is_active ??
                userData.isActive ??
                true,
              email: userData.user?.email || userData.email || '',
              schoolId:
                userData.user?.schoolId ||
                userData.user?.school_id ||
                userData.schoolId ||
                userData.school_id ||
                '',
              avatarUrl:
                userData.user?.avatarUrl ||
                userData.user?.avatar_url ||
                userData.avatarUrl ||
                userData.avatar_url,
            },
            portalKey: portalKey,
            permissions: userData.permissions || userData.user?.permissions || [],
          };
          return normalizedContext;
        }),
        tap((context) => this.authStore.setUserContext(context)),
        catchError((error) => {
          if (error.status === 401) {
            return throwError(
              () => new Error('Session expired. Please login again.')
            );
          }
          const message =
            error.error?.message ||
            error.error?.detail ||
            error.message ||
            'Failed to fetch user context';
          return throwError(
            () => new Error(`Failed to fetch user context: ${message}`)
          );
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
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  /**
   * Complete logout — clears tokens, user context, resets store, navigates to /login
   */
  logout(): void {
    this.tokenStorage.clearTokens();
    this.tokenStorage.clearUserContext();
    this.authStore.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Check if user is potentially authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenStorage.hasTokens() && !this.isTokenExpired();
  }
}
