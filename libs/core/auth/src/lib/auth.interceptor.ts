/**
 * Authentication HTTP Interceptor
 * Attaches Bearer tokens to requests and handles silent token refresh
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, catchError, switchMap, filter, take, finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthStore } from './auth.store';

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
  const router = inject(Router);

  // Add Ngrok bypass header to ALL requests (prevents CORS issues with ngrok free tier)
  req = req.clone({
    setHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

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
          router
        );
      }

      // Other errors - just pass through
      return throwError(() => error);
    })
  );
}

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

/**
 * Handle 401 error with silent token refresh
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  tokenStorage: TokenStorageService,
  authStore: AuthStore,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((tokens) => {
        // Save new tokens
        tokenStorage.saveTokens(tokens);
        authStore.updateTokens(tokens);

        isRefreshing = false;
        refreshSubject.next(tokens.access);

        // Retry the original request with new token
        const newReq = addTokenToRequest(req, tokens.access);
        return next(newReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshSubject.next(null);

        // Refresh failed - logout and redirect to login
        authStore.logout();
        router.navigate(['/login']);

        return throwError(() => refreshError);
      }),
      finalize(() => {
        // Safety: ensure isRefreshing is reset
        isRefreshing = false;
      })
    );
  } else {
    // Wait for the refresh to complete, then retry
    return refreshSubject.pipe(
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

/**
 * Class-based interceptor (for compatibility)
 * @deprecated Use authInterceptorFn instead
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Add Ngrok bypass header to ALL requests
    req = req.clone({
      setHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    // Skip if no token needed
    if (isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    // Add token to request
    const authReq = this.addTokenHeader(req, this.tokenStorage.getAccessToken());

    return next.handle(authReq).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokens) => {
          this.tokenStorage.saveTokens(tokens);
          this.authStore.updateTokens(tokens);

          this.isRefreshing = false;
          this.refreshSubject.next(tokens.access);

          const newReq = this.addTokenHeader(req, tokens.access);
          return next.handle(newReq);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.refreshSubject.next(null);
          this.authStore.logout();
          this.router.navigate(['/login']);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      return this.refreshSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          const newReq = this.addTokenHeader(req, token);
          return next.handle(newReq);
        })
      );
    }
  }

  private addTokenHeader(
    req: HttpRequest<unknown>,
    token: string | null
  ): HttpRequest<unknown> {
    if (!token) return req;
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
}
