import { Roles, ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';

/**
 * Roles Decorator Unit Tests
 *
 * Tests the @Roles() decorator to ensure it correctly sets metadata
 * for route handlers and controllers.
 */
describe('Roles Decorator', () => {
  describe('Roles decorator', () => {
    it('should be defined', () => {
      expect(Roles).toBeDefined();
      expect(typeof Roles).toBe('function');
    });

    it('should return a decorator function', () => {
      const decorator = Roles(Role.ADMIN);
      expect(typeof decorator).toBe('function');
    });

    it('should return a decorator function with multiple roles', () => {
      const decorator = Roles(Role.USER, Role.ADMIN);
      expect(typeof decorator).toBe('function');
    });

    it('should return a decorator function with no roles', () => {
      const decorator = Roles();
      expect(typeof decorator).toBe('function');
    });

    it('should accept Role enum values', () => {
      const validRoles = [Role.USER, Role.ADMIN];

      validRoles.forEach((role) => {
        expect(() => Roles(role)).not.toThrow();
      });
    });

    it('should accept multiple Role enum values', () => {
      expect(() => Roles(Role.USER, Role.ADMIN)).not.toThrow();
    });
  });

  describe('ROLES_KEY constant', () => {
    it('should be defined', () => {
      expect(ROLES_KEY).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof ROLES_KEY).toBe('string');
    });

    it('should be "roles"', () => {
      expect(ROLES_KEY).toBe('roles');
    });

    it('should be unique and not conflict with other metadata keys', () => {
      expect(ROLES_KEY).not.toBe('isPublic');
      expect(ROLES_KEY).not.toBe('currentUser');
    });
  });

  describe('decorator application', () => {
    it('should be applicable to a class method', () => {
      // This test verifies the decorator can be applied without errors
      class TestClass {
        @Roles(Role.ADMIN)
        testMethod() {}
      }

      expect(typeof TestClass.prototype.testMethod).toBe('function');
    });

    it('should be applicable with multiple roles', () => {
      class TestClass {
        @Roles(Role.USER, Role.ADMIN)
        testMethod() {}
      }

      expect(typeof TestClass.prototype.testMethod).toBe('function');
    });

    it('should be applicable to a class', () => {
      @Roles(Role.ADMIN)
      class TestClass {}

      expect(TestClass).toBeDefined();
    });
  });
});
