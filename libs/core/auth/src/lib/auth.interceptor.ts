/**
 * Authentication HTTP Interceptor
 * Attaches Bearer tokens to requests and handles silent token refresh
 */

import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable, throwError, catchError, switchMap, filter, take, finalize } from 'rxjs';
import { environment } from '@sms/core/config';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthStore } from './auth.store';
import { TokenRefreshService } from './token-refresh.service';

/**
 * Functional HTTP interceptor for Angular v15+
 */
export function authInterceptorFn(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const authStore = inject(AuthStore);
  const tokenRefresh = inject(TokenRefreshService);


  // Skip if no token needed
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  // Add token to request
  const authReq = addTokenToRequest(req, tokenStorage.getAccessToken());

  return next(authReq).pipe(
    catchError((error) => {
      // Only handle 401 errors
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(
          req,
          next,
          authService,
          tokenStorage,
          authStore,
          tokenRefresh
        );
      }

      // Other errors - just pass through
      return throwError(() => error);
    })
  );
}

/**
 * Handle 401 error with silent token refresh
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  tokenStorage: TokenStorageService,
  authStore: AuthStore,
  tokenRefresh: TokenRefreshService
): Observable<HttpEvent<unknown>> {
  if (!tokenRefresh.isRefreshing) {
    tokenRefresh.isRefreshing = true;
    tokenRefresh.refreshSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((tokens) => {
        tokenStorage.saveTokens(tokens);
        authStore.updateTokens(tokens);

        tokenRefresh.isRefreshing = false;
        tokenRefresh.refreshSubject.next(tokens.access);

        const newReq = addTokenToRequest(req, tokens.access);
        return next(newReq);
      }),
      catchError((refreshError) => {
        tokenRefresh.reset();
        // Error propagates to authErrorInterceptor which handles logout + redirect
        return throwError(() => refreshError);
      }),
      finalize(() => {
        tokenRefresh.isRefreshing = false;
      })
    );
  } else {
    return tokenRefresh.refreshSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        const newReq = addTokenToRequest(req, token);
        return next(newReq);
      })
    );
  }
}

/**
 * Add authorization header to request
 */
function addTokenToRequest(
  req: HttpRequest<unknown>,
  token: string | null
): HttpRequest<unknown> {
  if (!token) {
    return req;
  }

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Check if endpoint doesn't need authentication
 */
function isPublicEndpoint(url: string): boolean {
  const publicEndpoints = [
    '/auth/login',
    '/auth/refresh',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];

  return publicEndpoints.some((endpoint) => url.includes(endpoint));
}

