/**
 * ProtectedRoute Component Tests
 *
 * Tests the protected route component that guards authenticated routes.
 * Verifies redirection logic for unauthenticated users.
 *
 * Test Level: Component
 * Priority: P1 (High - Security-critical authentication flow)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/stores/auth.store';

// Mock auth store
vi.mock('@/stores/auth.store');

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: [P1] Renders children when authenticated
   *
   * GIVEN: User is authenticated
   * WHEN: Protected route is accessed
   * THEN: Renders the protected component
   */
  describe('[P1] Authenticated user access', () => {
    it('should render protected component when user is authenticated', async () => {
      // GIVEN: User is authenticated
      (useAuthStore as any).mockImplementation((callback) => callback({
        isAuthenticated: true,
        user: { id: '123', email: 'test@example.com' },
      }));

      // WHEN: Accessing protected route
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // THEN: Protected content is visible
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeVisible();
      });
    });
  });

  /**
   * Test: [P1] Redirects unauthenticated users
   *
   * GIVEN: User is not authenticated
   * WHEN: Protected route is accessed
   * THEN: Redirects to login page
   */
  describe('[P1] Unauthenticated user redirect', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // GIVEN: Unauthenticated user
      (useAuthStore as any).mockImplementation((callback) => callback({
        isAuthenticated: false,
        user: null,
      }));

      // WHEN: Accessing protected route
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      // THEN: Redirects to login page
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeVisible();
      });
    });

    it('should redirect to login when user is null but authenticated is true', async () => {
      // GIVEN: Auth flag is true but user is null
      (useAuthStore as any).mockImplementation((callback) => callback({
        isAuthenticated: true,
        user: null,
      }));

      // WHEN: Accessing protected route
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      // THEN: Redirects to login page (user is required)
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeVisible();
      });
    });
  });

  /**
   * Test: [P1] Render with user data
   *
   * GIVEN: User is authenticated with user data
   * WHEN: Protected route is accessed
   * THEN: Renders children correctly
   */
  describe('[P1] User data handling', () => {
    it('should render when both isAuthenticated and user are present', async () => {
      // GIVEN: User is authenticated with user data
      (useAuthStore as any).mockImplementation((callback) => callback({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'USER' },
      }));

      // WHEN: Accessing protected route
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // THEN: Protected content is visible
      await waitFor(() => {
        expect(screen.getByText('Protected Dashboard')).toBeVisible();
      });
    });
  });

  /**
   * Test: [P1] Admin user access
   *
   * GIVEN: Admin user is authenticated
   * WHEN: Protected route is accessed
   * THEN: Renders the protected component
   */
  describe('[P1] Admin user access', () => {
    it('should render for admin users', async () => {
      // GIVEN: Admin user is authenticated
      (useAuthStore as any).mockImplementation((callback) => callback({
        isAuthenticated: true,
        user: { id: 'admin-123', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' },
      }));

      // WHEN: Accessing protected route
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Admin Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // THEN: Protected content is visible
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeVisible();
      });
    });
  });
});
