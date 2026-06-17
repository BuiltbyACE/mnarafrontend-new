import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { TokenStorageService } from './token-storage.service';
import type { Tokens, UserContext } from '@sms/shared/models';

describe('AuthStore', () => {
  let store: AuthStore;
  let tokenStorage: jest.Mocked<TokenStorageService>;

  beforeEach(() => {
    const mockTokenStorage = {
      saveTokens: jest.fn(),
      saveUserContext: jest.fn(),
      getAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      getUserContext: jest.fn(),
      clearAll: jest.fn(),
      clearTokens: jest.fn(),
      clearUserContext: jest.fn(),
      hasTokens: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: TokenStorageService, useValue: mockTokenStorage },
      ],
    });

    store = TestBed.inject(AuthStore);
    tokenStorage = TestBed.inject(TokenStorageService) as jest.Mocked<TokenStorageService>;
  });

  it('starts with default empty state', () => {
    expect(store.identifier()).toBe('');
    expect(store.user()).toBeNull();
    expect(store.tokens()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.portalType()).toBeNull();
    expect(store.roleName()).toBeNull();
    expect(store.userPermissions()).toEqual([]);
    expect(store.fullName()).toBe('');
  });

  describe('setIdentifier', () => {
    it('updates identifier signal', () => {
      store.setIdentifier('admin@test.com');
      expect(store.identifier()).toBe('admin@test.com');
    });
  });

  describe('setTokens', () => {
    const tokens: Tokens = { access: 'abc', refresh: 'def' };

    it('saves tokens to storage and updates signal', () => {
      store.setTokens(tokens);
      expect(tokenStorage.saveTokens).toHaveBeenCalledWith(tokens);
      expect(store.tokens()).toEqual(tokens);
    });

    it('reflects isAuthenticated as true after setting tokens', () => {
      expect(store.isAuthenticated()).toBe(false);
      store.setTokens(tokens);
      expect(store.isAuthenticated()).toBe(true);
    });
  });

  describe('setUserContext', () => {
    const userContext: UserContext = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        email: 'john@test.com',
        schoolId: 'SCH001',
      },
      portalKey: 'admin-portal',
      permissions: ['users.read', 'users.write'],
    };

    it('saves user context to storage and updates signal', () => {
      store.setUserContext(userContext);
      expect(tokenStorage.saveUserContext).toHaveBeenCalledWith(userContext);
      expect(store.user()).toEqual(userContext);
    });

    it('derives portalType from portalKey', () => {
      store.setUserContext(userContext);
      expect(store.portalType()).toBe('ADMIN');
    });

    it('derives roleName from portalKey', () => {
      store.setUserContext(userContext);
      expect(store.roleName()).toBe('Admin');
    });

    it('computes fullName from user profile', () => {
      store.setUserContext(userContext);
      expect(store.fullName()).toBe('John Doe');
    });

    it('falls back to firstName when lastName is missing', () => {
      store.setUserContext({
        ...userContext,
        user: { ...userContext.user, lastName: undefined },
      });
      expect(store.fullName()).toBe('John');
    });

    it('exposes permissions', () => {
      store.setUserContext(userContext);
      expect(store.userPermissions()).toEqual(['users.read', 'users.write']);
    });
  });

  describe('isGodMode', () => {
    it('returns false when user has no permissions', () => {
      expect(store.isGodMode()).toBe(false);
    });

    it('returns true when user has wildcard permission', () => {
      store.setUserContext({
        user: { firstName: 'Admin', isActive: true },
        portalKey: 'admin-portal',
        permissions: ['*'],
      });
      expect(store.isGodMode()).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('returns true for god-mode users regardless of permission', () => {
      store.setUserContext({
        user: { firstName: 'Admin', isActive: true },
        portalKey: 'admin-portal',
        permissions: ['*'],
      });
      expect(store.hasPermission('anything')).toBe(true);
    });

    it('checks permission in user permissions list', () => {
      store.setUserContext({
        user: { firstName: 'User', isActive: true },
        portalKey: 'admin-portal',
        permissions: ['users.read'],
      });
      expect(store.hasPermission('users.read')).toBe(true);
      expect(store.hasPermission('users.write')).toBe(false);
    });
  });

  describe('setLoading / setError', () => {
    it('toggles loading state', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });

    it('sets and clears error', () => {
      store.setError('Something went wrong');
      expect(store.error()).toBe('Something went wrong');
      store.clearError();
      expect(store.error()).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears storage and resets state', () => {
      store.setTokens({ access: 'a', refresh: 'b' });
      store.setUserContext({
        user: { firstName: 'U', isActive: true },
        portalKey: 'admin-portal',
        permissions: [],
      });
      store.setLoading(true);

      store.logout();

      expect(tokenStorage.clearAll).toHaveBeenCalled();
      expect(store.tokens()).toBeNull();
      expect(store.user()).toBeNull();
      expect(store.identifier()).toBe('');
      expect(store.isLoading()).toBe(false);
      expect(store.isAuthenticated()).toBe(false);
    });
  });

  describe('restoreFromStorage', () => {
    it('rehydrates tokens and user context from storage', () => {
      tokenStorage.getAccessToken.mockReturnValue('stored_access');
      tokenStorage.getRefreshToken.mockReturnValue('stored_refresh');
      tokenStorage.getUserContext.mockReturnValue({
        user: { firstName: 'Restored', isActive: true },
        portalKey: 'student-portal',
        permissions: [],
      });

      store.restoreFromStorage();

      expect(store.tokens()).toEqual({ access: 'stored_access', refresh: 'stored_refresh' });
      expect(store.user()).toEqual({
        user: { firstName: 'Restored', isActive: true },
        portalKey: 'student-portal',
        permissions: [],
      });
    });

    it('does not overwrite existing tokens when storage is empty', () => {
      store.setTokens({ access: 'existing', refresh: 'existing' });
      tokenStorage.getAccessToken.mockReturnValue(null);

      store.restoreFromStorage();

      expect(store.tokens()).toEqual({ access: 'existing', refresh: 'existing' });
    });
  });
});
