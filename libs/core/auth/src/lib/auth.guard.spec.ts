import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let router: Router;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    const mockAuthService = {
      isAuthenticated: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
  });

  it('allows activation when user is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/admin' } as any)
    );

    expect(result).toBe(true);
  });

  it('redirects to /login with returnUrl when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/admin/dashboard' } as any)
    );

    const tree = router.parseUrl('/login?returnUrl=%2Fadmin%2Fdashboard');
    expect(result).toEqual(tree);
  });

  it('encodes complex URLs in returnUrl', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/teacher/class/101?semester=1' } as any)
    );

    const tree = router.parseUrl('/login?returnUrl=%2Fteacher%2Fclass%2F101%3Fsemester%3D1');
    expect(result).toEqual(tree);
  });
});
