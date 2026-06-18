import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login-page';
import { AuthStore, AuthService } from '@sms/core/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { PortalType } from '@sms/shared/models';

describe('LoginPage', () => {
  let component: LoginPage;
  let authService: jest.Mocked<AuthService>;
  let authStore: jest.Mocked<AuthStore>;
  let router: jest.Mocked<Router>;
  let snackBarOpen: jest.Mock;
  let activatedRoute: any;

  const createComponent = (queryParams: Record<string, string> = {}) => {
    activatedRoute = { snapshot: { queryParams } };

    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    });

    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    snackBarOpen = jest.fn();
    jest.spyOn(MatSnackBar.prototype, 'open').mockImplementation(snackBarOpen);

    authService = {
      login: jest.fn(),
      fetchUserContext: jest.fn(),
    } as any;

    authStore = {
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      portalType: jest.fn(),
    } as any;

    router = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onSubmit', () => {
    it('does nothing when email or password are empty', () => {
      createComponent();
      component.email = '';
      component.password = '';
      component.onSubmit();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('does nothing when already loading', () => {
      createComponent();
      component.email = 'test@test.com';
      component.password = 'password';
      component.isLoading = true;
      component.onSubmit();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('calls login then fetchUserContext on success', () => {
      createComponent();
      component.email = 'admin@school.com';
      component.password = 'secret';

      authService.login.mockReturnValue(of({} as any));
      authService.fetchUserContext.mockReturnValue(of({} as any));
      authStore.portalType.mockReturnValue('ADMIN' as PortalType);

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        school_id: 'admin@school.com',
        password: 'secret',
      });
      expect(authService.fetchUserContext).toHaveBeenCalled();
    });

    it('navigates to returnUrl when present in query params', () => {
      createComponent({ returnUrl: '/teacher/class/101' });
      component.email = 'teacher@school.com';
      component.password = 'secret';

      authService.login.mockReturnValue(of({} as any));
      authService.fetchUserContext.mockReturnValue(of({} as any));

      component.onSubmit();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/teacher/class/101', { replaceUrl: true });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('navigates based on portalType when no returnUrl', () => {
      createComponent();
      component.email = 'student@school.com';
      component.password = 'secret';

      authService.login.mockReturnValue(of({} as any));
      authService.fetchUserContext.mockReturnValue(of({} as any));
      authStore.portalType.mockReturnValue('STUDENT' as PortalType);

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/student'], { replaceUrl: true });
    });

    it('shows snackbar for unrecognized portal type', () => {
      createComponent();
      component.email = 'unknown@school.com';
      component.password = 'secret';

      authService.login.mockReturnValue(of({} as any));
      authService.fetchUserContext.mockReturnValue(of({} as any));
      authStore.portalType.mockReturnValue(null);

      component.onSubmit();

      expect(snackBarOpen).toHaveBeenCalledWith(
        'Unrecognized user role.',
        'Dismiss',
        expect.objectContaining({ duration: 5000 }),
      );
    });

    it('calls handleError when login fails', () => {
      createComponent();
      component.email = 'fail@school.com';
      component.password = 'wrong';

      const error = new Error('Invalid credentials');
      authService.login.mockReturnValue(throwError(() => error));

      component.onSubmit();

      expect(authStore.setError).toHaveBeenCalledWith('Invalid credentials');
      expect(snackBarOpen).toHaveBeenCalledWith(
        'Invalid credentials',
        'Dismiss',
        expect.any(Object),
      );
    });

    it('sets loading state during submission', () => {
      createComponent();
      component.email = 'admin@school.com';
      component.password = 'secret';

      authService.login.mockReturnValue(of({} as any));
      authService.fetchUserContext.mockReturnValue(of({} as any));
      authStore.portalType.mockReturnValue('ADMIN' as PortalType);

      component.onSubmit();

      expect(authStore.setLoading).toHaveBeenCalledWith(true);
      expect(authStore.clearError).toHaveBeenCalled();
    });
  });

  describe('navigation routes map', () => {
    const testCases: Array<{ portalType: PortalType; expectedRoute: string }> = [
      { portalType: 'ADMIN', expectedRoute: '/admin' },
      { portalType: 'STAFF', expectedRoute: '/admin' },
      { portalType: 'TEACHER', expectedRoute: '/teacher' },
      { portalType: 'STUDENT', expectedRoute: '/student' },
      { portalType: 'PARENT', expectedRoute: '/parent' },
      { portalType: 'TRANSPORT', expectedRoute: '/transport' },
      { portalType: 'FINANCE', expectedRoute: '/finance' },
    ];

    testCases.forEach(({ portalType, expectedRoute }) => {
      it(`navigates to ${expectedRoute} for ${portalType}`, () => {
        createComponent();
        component.email = 'test@test.com';
        component.password = 'password';

        authService.login.mockReturnValue(of({} as any));
        authService.fetchUserContext.mockReturnValue(of({} as any));
        authStore.portalType.mockReturnValue(portalType);

        component.onSubmit();

        expect(router.navigate).toHaveBeenCalledWith([expectedRoute], { replaceUrl: true });
      });
    });
  });
});
