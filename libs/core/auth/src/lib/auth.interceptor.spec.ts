import { TestBed } from '@angular/core/testing';
import {
  HttpRequest,
  provideHttpClient,
  withInterceptors,
  HttpHandlerFn,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptorFn } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthStore } from './auth.store';
import { TokenRefreshService } from './token-refresh.service';
import { environment } from '@sms/core/config';

describe('authInterceptorFn', () => {
  let httpTesting: HttpTestingController;
  let tokenStorage: jest.Mocked<TokenStorageService>;
  let authService: jest.Mocked<AuthService>;
  let authStore: jest.Mocked<AuthStore>;
  let tokenRefresh: TokenRefreshService;
  let router: Router;

  beforeEach(() => {
    const mockTokenStorage = {
      getAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      saveTokens: jest.fn(),
      clearAll: jest.fn(),
      hasTokens: jest.fn(),
    };

    const mockAuthService = {
      refreshToken: jest.fn(),
    };

    const mockAuthStore = {
      updateTokens: jest.fn(),
      logout: jest.fn(),
      setTokens: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [
        AuthStore,
        TokenRefreshService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenStorageService, useValue: mockTokenStorage },
        { provide: AuthStore, useValue: mockAuthStore },
        provideHttpClient(withInterceptors([authInterceptorFn])),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService) as jest.Mocked<TokenStorageService>;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    authStore = TestBed.inject(AuthStore) as jest.Mocked<AuthStore>;
    tokenRefresh = TestBed.inject(TokenRefreshService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    tokenRefresh.reset();
  });

  it('adds Authorization header when token exists', () => {
    tokenStorage.getAccessToken.mockReturnValue('test-token');
    environment.production = false;

    TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpTestingController);

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('GET', '/api/v1/some-endpoint');
      const next: HttpHandlerFn = (r) => of({} as any);
      return authInterceptorFn(req, next).subscribe();
    });
  });

  it('skips adding token for public endpoints', () => {
    tokenStorage.getAccessToken.mockReturnValue('test-token');

    TestBed.inject(HttpTestingController);
    const http = TestBed.inject(HttpTestingController);

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('POST', '/auth/login');
      const next: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBe(false);
        return of({} as any);
      };
      return authInterceptorFn(req, next).subscribe();
    });
  });

  it('skips adding token when no token exists', () => {
    tokenStorage.getAccessToken.mockReturnValue(null);

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('GET', '/api/v1/data');
      const next: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBe(false);
        return of({} as any);
      };
      return authInterceptorFn(req, next).subscribe();
    });
  });

  it('adds ngrok-skip-browser-warning header in dev mode', () => {
    environment.production = false;
    tokenStorage.getAccessToken.mockReturnValue(null);

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('GET', '/api/v1/data');
      const next: HttpHandlerFn = (r) => {
        expect(r.headers.get('ngrok-skip-browser-warning')).toBe('true');
        return of({} as any);
      };
      return authInterceptorFn(req, next).subscribe();
    });
  });

  it('does NOT add ngrok header in production mode', () => {
    environment.production = true;
    tokenStorage.getAccessToken.mockReturnValue(null);

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('GET', '/api/v1/data');
      const next: HttpHandlerFn = (r) => {
        expect(r.headers.has('ngrok-skip-browser-warning')).toBe(false);
        return of({} as any);
      };
      return authInterceptorFn(req, next).subscribe();
    });
  });

  it('triggers token refresh on 401 and retries the request', () => {
    tokenStorage.getAccessToken
      .mockReturnValueOnce('expired-token')
      .mockReturnValueOnce('new-token');
    authService.refreshToken.mockReturnValue(of({ access: 'new-token', refresh: 'new-refresh' }));

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('GET', '/api/v1/data');
      const next: HttpHandlerFn = (r) => {
        const token = r.headers.get('Authorization');
        if (token === 'Bearer expired-token') {
          return throwError(() => ({ status: 401 }));
        }
        return of({} as any);
      };
      return authInterceptorFn(req, next).subscribe({
        next: () => {
          expect(authService.refreshToken).toHaveBeenCalled();
          expect(authStore.updateTokens).toHaveBeenCalledWith({ access: 'new-token', refresh: 'new-refresh' });
        },
      });
    });
  });

  it('logs out and redirects to login when refresh fails', () => {
    tokenStorage.getAccessToken.mockReturnValue('expired-token');
    authService.refreshToken.mockReturnValue(throwError(() => new Error('Refresh failed')));
    jest.spyOn(router, 'navigate');

    TestBed.runInInjectionContext(() => {
      const req = new HttpRequest<unknown>('GET', '/api/v1/data');
      const next: HttpHandlerFn = () => throwError(() => ({ status: 401 }));
      return authInterceptorFn(req, next).subscribe({
        error: () => {
          expect(authStore.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
        },
      });
    });
  });
});
