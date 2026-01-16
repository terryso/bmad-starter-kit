import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Setup MSW mock server for API testing
 *
 * Mocks all API endpoints to avoid real network calls during tests.
 */

// Mock user data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

// Simulate network delay for testing loading states
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handlers = [
  // Login endpoint
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    // Simulate network delay for loading state tests
    await delay(100);

    // Check credentials - fail for wrong credentials
    if (body.email === 'wrong@example.com' || body.password === 'wrongpassword') {
      return HttpResponse.json(
        {
          statusCode: 401,
          message: '邮箱或密码错误',
          data: null,
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      },
      statusCode: 200,
      message: 'success',
    });
  }),

  // Register endpoint
  http.post('/api/v1/auth/register', async () => {
    // Simulate network delay for loading state tests
    await delay(100);

    return HttpResponse.json({
      data: {
        user: mockUser,
      },
      statusCode: 200,
      message: 'success',
    });
  }),

  // Refresh token endpoint
  http.post('/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      data: {
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      },
      statusCode: 200,
      message: 'success',
    });
  }),

  // Logout endpoint
  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({
      data: null,
      statusCode: 200,
      message: 'success',
    });
  }),

  // User profile endpoint
  http.get('/api/v1/users/profile', () => {
    return HttpResponse.json({
      data: mockUser,
      statusCode: 200,
      message: 'success',
    });
  }),

  // Admin stats endpoint
  http.get('/api/v1/admin/stats', () => {
    return HttpResponse.json({
      data: {
        totalUsers: 42,
        newUsersToday: 3,
        newUsersThisMonth: 18,
      },
      statusCode: 200,
      message: 'success',
    });
  }),
];

// Export setup function for use in test files
export function setupMockServer() {
  const server = setupServer(...handlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
}

// Export server for direct access in tests
export const mockServer = setupServer(...handlers);
