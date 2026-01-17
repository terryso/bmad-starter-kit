/**
 * Auth Store Unit Tests
 *
 * Tests the Zustand auth store for state management,
 * persistence, and token refresh logic.
 *
 * Test Level: Unit
 * Priority: P1 (High - Core authentication state)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './auth.store';
import { authApi } from '@/lib/api';

// Mock localStorage
const testStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => testStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    testStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete testStorage[key];
  },
  clear: () => {
    Object.keys(testStorage).forEach(key => delete testStorage[key]);
  },
  get length() {
    return Object.keys(testStorage).length;
  },
  key: (index: number) => Object.keys(testStorage)[index] ?? null,
};

vi.stubGlobal('localStorage', localStorageMock);

// Mock authApi
vi.mock('@/lib/api', () => ({
  authApi: {
    refreshToken: vi.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear storage
    Object.keys(testStorage).forEach(key => delete testStorage[key]);
    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
    });
  });

  /**
   * Test: [P1] Initial state
   *
   * GIVEN: Store is initialized
   * WHEN: No previous state exists
   * THEN: Returns default unauthenticated state
   */
  describe('[P1] Initial state', () => {
    it('should have initial unauthenticated state', () => {
      // GIVEN: Fresh store
      const state = useAuthStore.getState();

      // THEN: Default values
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state._hasHydrated).toBe(false);
    });
  });

  /**
   * Test: [P1] Authentication actions
   *
   * GIVEN: User credentials are valid
   * WHEN: setAuth is called
   * THEN: Updates auth state correctly
   */
  describe('[P1] Authentication actions', () => {
    it('should set auth state when setAuth is called', () => {
      // GIVEN: Mock user data
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        createdAt: new Date(),
      };
      const mockToken = 'test-access-token';

      // WHEN: Setting auth state
      useAuthStore.getState().setAuth(mockUser, mockToken);
      const state = useAuthStore.getState();

      // THEN: State is updated
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state._hasHydrated).toBe(true);
    });

    it('should update user when setUser is called', () => {
      // GIVEN: Authenticated user
      const initialUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        createdAt: new Date(),
      };
      useAuthStore.getState().setAuth(initialUser, 'token');

      // WHEN: Updating user
      const updatedUser = { ...initialUser, name: 'Updated Name' };
      useAuthStore.getState().setUser(updatedUser);
      const state = useAuthStore.getState();

      // THEN: User is updated, auth remains true
      expect(state.user).toEqual(updatedUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear auth state when clearAuth is called', () => {
      // GIVEN: Authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        createdAt: new Date(),
      };
      useAuthStore.getState().setAuth(mockUser, 'token');

      // WHEN: Clearing auth
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();

      // THEN: State is cleared
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should return access token from getAccessToken', () => {
      // GIVEN: Authenticated user
      const mockToken = 'test-token';
      useAuthStore.getState().setAuth(
        { id: '123', email: 'test@test.com', name: 'Test', role: 'USER', createdAt: new Date() },
        mockToken
      );

      // WHEN: Getting token
      const token = useAuthStore.getState().getAccessToken();

      // THEN: Returns correct token
      expect(token).toBe(mockToken);
    });
  });

  /**
   * Test: [P1] Token refresh
   *
   * GIVEN: Refresh token exists
   * WHEN: refreshAuth is called
   * THEN: Updates state with new token and user
   */
  describe('[P1] Token refresh', () => {
    it('should refresh auth state on successful refresh', async () => {
      // GIVEN: Mock refresh response
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        createdAt: new Date(),
      };
      const newToken = 'new-access-token';

      vi.mocked(authApi).refreshToken.mockResolvedValue({
        statusCode: 200,
        data: {
          accessToken: newToken,
          user: mockUser,
        },
      });

      // WHEN: Refreshing auth
      const result = await useAuthStore.getState().refreshAuth();
      const state = useAuthStore.getState();

      // THEN: State is updated with new data
      expect(result).toBe(true);
      expect(state.accessToken).toBe(newToken);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear auth state on failed refresh', async () => {
      // GIVEN: Mock refresh failure
      vi.mocked(authApi).refreshToken.mockRejectedValue(new Error('Invalid token'));

      // Set initial auth state
      useAuthStore.getState().setAuth(
        { id: '123', email: 'test@test.com', name: 'Test', role: 'USER', createdAt: new Date() },
        'old-token'
      );

      // WHEN: Refresh fails
      const result = await useAuthStore.getState().refreshAuth();
      const state = useAuthStore.getState();

      // THEN: State is cleared
      expect(result).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle 401 refresh token errors', async () => {
      // GIVEN: Mock 401 error
      const error = {
        response: {
          status: 401,
          data: { message: 'Invalid refresh token' },
        },
      };
      vi.mocked(authApi).refreshToken.mockRejectedValue(error);

      // WHEN: Refresh fails with 401
      const result = await useAuthStore.getState().refreshAuth();

      // THEN: Returns false and clears state
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  /**
   * Test: [P2] Hydration state
   *
   * GIVEN: Store is initialized
   * WHEN: _hasHydrated state changes
   * THEN: Correctly reflects hydration status
   */
  describe('[P2] Hydration state', () => {
    it('should set _hasHydrated to true when _setHasHydrated is called', () => {
      // GIVEN: Initial state
      expect(useAuthStore.getState()._hasHydrated).toBe(false);

      // WHEN: Setting hydrated
      useAuthStore.getState()._setHasHydrated();

      // THEN: Hydrated is true
      expect(useAuthStore.getState()._hasHydrated).toBe(true);
    });
  });
});
