import { AdminGuard } from './admin.guard';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * AdminGuard Unit Tests
 *
 * Tests the specialized admin-only guard that only allows ADMIN role users.
 */
describe('AdminGuard', () => {
  let guard: AdminGuard;

  // Helper to create mock execution context
  const createMockContext = (user: any): any => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  };

  beforeEach(() => {
    guard = new AdminGuard();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be created successfully', () => {
      expect(guard).toBeDefined();
    });
  });

  describe('canActivate - with admin user', () => {
    it('should allow access when user has ADMIN role', () => {
      const context = createMockContext({
        userId: '123',
        email: 'admin@example.com',
        role: Role.ADMIN,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should not check metadata (unlike RolesGuard)', () => {
      const context = createMockContext({
        userId: '123',
        role: Role.ADMIN,
      });

      // AdminGuard doesn't use reflector for role metadata
      // It directly checks if user.role === Role.ADMIN
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('canActivate - with non-admin user', () => {
    it('should throw ForbiddenException when user has USER role', () => {
      const context = createMockContext({
        userId: '123',
        email: 'user@example.com',
        role: Role.USER,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('需要管理员权限');
    });

    it('should throw ForbiddenException with correct response structure', () => {
      const context = createMockContext({
        userId: '123',
        email: 'user@example.com',
        role: Role.USER,
      });

      try {
        guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.response.message).toBe('需要管理员权限');
      }
    });
  });

  describe('canActivate - with no user', () => {
    it('should return false when no user is attached to request', () => {
      const context = createMockContext(null);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when user is undefined', () => {
      const context = createMockContext(undefined);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should not throw when user is null (returns false for auth guard to handle)', () => {
      const context = createMockContext(null);

      expect(() => guard.canActivate(context)).not.toThrow();
      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('canActivate - edge cases', () => {
    it('should handle user object without role property', () => {
      const context = createMockContext({
        userId: '123',
        email: 'user@example.com',
        // no role property
      });

      // Role check will fail (undefined !== Role.ADMIN)
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should only allow ADMIN role from Role enum', () => {
      const adminContext = createMockContext({
        userId: '1',
        role: Role.ADMIN,
      });
      const userContext = createMockContext({
        userId: '2',
        role: Role.USER,
      });

      expect(guard.canActivate(adminContext)).toBe(true);
      expect(() => guard.canActivate(userContext)).toThrow(ForbiddenException);
    });
  });

  describe('comparison with RolesGuard behavior', () => {
    it('should allow the same access as RolesGuard with @Roles(Role.ADMIN)', () => {
      const adminUser = { userId: '1', role: Role.ADMIN };
      const regularUser = { userId: '2', role: Role.USER };

      const adminContext = createMockContext(adminUser);
      const userContext = createMockContext(regularUser);

      // Admin user should be allowed
      expect(guard.canActivate(adminContext)).toBe(true);

      // Regular user should be denied
      expect(() => guard.canActivate(userContext)).toThrow(ForbiddenException);
    });
  });
});
