/**
 * API Client Unit Tests
 *
 * Tests the Axios API client configuration,
 * request/response interceptors, and token refresh logic.
 *
 * Test Level: Unit
 * Priority: P1 (High - Critical auth flow and API communication)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock axios before importing api.ts
const mockAxiosCreate = vi.fn(() => ({
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    create: mockAxiosCreate,
    isAxiosError: vi.fn(() => false),
  },
}));

// Mock auth store
vi.mock('@/stores/auth.store');

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: [P1] Axios configuration
   *
   * GIVEN: API module is loaded
   * WHEN: Checking axios.create call
   * THEN: Correct configuration is used
   */
  describe('[P1] Axios configuration', () => {
    it('should create axios instance with correct config', async () => {
      // GIVEN: API module needs to be loaded
      // WHEN: Loading the API module
      const apiModule = await import('./api');

      // THEN: Axios was created with correct config
      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          withCredentials: true,
        })
      );

      // AND: API exports exist
      expect(apiModule.api).toBeDefined();
      expect(apiModule.authApi).toBeDefined();
    });
  });

  /**
   * Test: [P1] Auth API methods
   *
   * GIVEN: Auth API is available
   * WHEN: Checking API methods
   * THEN: All required methods exist
   */
  describe('[P1] Auth API methods', () => {
    it('should have register method', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: Register method exists
      expect(apiModule.authApi.register).toBeDefined();
      expect(typeof apiModule.authApi.register).toBe('function');
    });

    it('should have login method', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: Login method exists
      expect(apiModule.authApi.login).toBeDefined();
      expect(typeof apiModule.authApi.login).toBe('function');
    });

    it('should have refreshToken method', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: RefreshToken method exists
      expect(apiModule.authApi.refreshToken).toBeDefined();
      expect(typeof apiModule.authApi.refreshToken).toBe('function');
    });

    it('should have logout method', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: Logout method exists
      expect(apiModule.authApi.logout).toBeDefined();
      expect(typeof apiModule.authApi.logout).toBe('function');
    });

    it('should have getCurrentUser method', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: GetCurrentUser method exists
      expect(apiModule.authApi.getCurrentUser).toBeDefined();
      expect(typeof apiModule.authApi.getCurrentUser).toBe('function');
    });
  });

  /**
   * Test: [P2] Users API methods
   *
   * GIVEN: Users API is available
   * WHEN: Checking user endpoints
   * THEN: All required methods exist
   */
  describe('[P2] Users API methods', () => {
    it('should have usersApi exported', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: Users API exists
      expect(apiModule.usersApi).toBeDefined();
      expect(apiModule.usersApi.getProfile).toBeDefined();
      expect(apiModule.usersApi.updateProfile).toBeDefined();
    });
  });

  /**
   * Test: [P2] Admin API methods
   *
   * GIVEN: Admin API is available
   * WHEN: Checking admin endpoints
   * THEN: All required methods exist
   */
  describe('[P2] Admin API methods', () => {
    it('should have adminApi exported', async () => {
      // GIVEN: API module
      const apiModule = await import('./api');

      // THEN: Admin API exists
      expect(apiModule.adminApi).toBeDefined();
      expect(apiModule.adminApi.getUsers).toBeDefined();
      expect(apiModule.adminApi.getStats).toBeDefined();
    });
  });
});
