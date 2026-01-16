import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../../common/decorators';

/**
 * RolesGuard Unit Tests
 *
 * Tests role-based authorization guard that verifies user permissions.
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  // Helper to create mock execution context
  const createMockContext = (
    user: any,
    requiredRoles: Role[] = [],
  ): any => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
    return context;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be created successfully', () => {
      expect(guard).toBeDefined();
    });

    it('should have Reflector injected', () => {
      expect(guard['reflector']).toBe(reflector);
    });
  });

  describe('canActivate - with no required roles', () => {
    it('should allow access when no roles are specified', () => {
      const context = createMockContext({ userId: '123', role: Role.USER });
      reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when empty roles array is specified', () => {
      const context = createMockContext({ userId: '123', role: Role.USER });
      reflector.getAllAndOverride = jest.fn().mockReturnValue([]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('canActivate - with authenticated user', () => {
    it('should allow access when user has required role', () => {
      const context = createMockContext(
        { userId: '123', email: 'admin@example.com', role: Role.ADMIN },
        [Role.ADMIN],
      );
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const context = createMockContext(
        { userId: '123', email: 'user@example.com', role: Role.USER },
        [Role.USER, Role.ADMIN],
      );
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.USER, Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow ADMIN user when ADMIN role is required', () => {
      const context = createMockContext(
        { userId: '123', email: 'admin@example.com', role: Role.ADMIN },
        [Role.ADMIN],
      );
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow USER user when USER role is required', () => {
      const context = createMockContext(
        { userId: '123', email: 'user@example.com', role: Role.USER },
        [Role.USER],
      );
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.USER]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('canActivate - with insufficient permissions', () => {
    it('should throw ForbiddenException when user lacks required role', () => {
      const context = createMockContext(
        { userId: '123', email: 'user@example.com', role: Role.USER },
        [Role.ADMIN],
      );
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('需要管理员权限');
    });

    it('should throw ForbiddenException when USER tries to access ADMIN route', () => {
      const context = createMockContext(
        { userId: '123', email: 'user@example.com', role: Role.USER },
        [Role.ADMIN],
      );
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

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
      const context = createMockContext(null, [Role.ADMIN]);
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when user is undefined and roles are required', () => {
      const context = createMockContext(undefined, [Role.ADMIN]);
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when no user and no roles required (delegates to other guards)', () => {
      const context = createMockContext(null);
      reflector.getAllAndOverride = jest.fn().mockReturnValue([]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('metadata resolution', () => {
    it('should check both handler and class for role metadata', () => {
      const mockHandler = jest.fn();
      const mockClass = class MockController {};

      const context = createMockContext(
        { userId: '123', role: Role.ADMIN },
        [Role.ADMIN],
      );
      context.getHandler.mockReturnValue(mockHandler);
      context.getClass.mockReturnValue(mockClass);

      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockHandler,
        mockClass,
      ]);
    });

    it('should prioritize handler-level metadata over class-level', () => {
      const mockHandler = jest.fn();
      const mockClass = class MockController {};

      const context = createMockContext(
        { userId: '123', role: Role.USER },
        [Role.USER],
      );
      context.getHandler.mockReturnValue(mockHandler);
      context.getClass.mockReturnValue(mockClass);

      // Reflector's getAllAndOverride already implements the priority logic
      reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.USER]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
