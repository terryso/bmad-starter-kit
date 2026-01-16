import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';

/**
 * JwtAuthGuard Unit Tests
 *
 * Note: We only test the custom handleRequest method since testing canActivate
 * requires mocking the entire Passport/JWT authentication flow which is complex.
 * The handleRequest method contains our custom logic for different error types.
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
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

  describe('handleRequest - custom error handling logic', () => {
    it('should return user when authentication succeeds', () => {
      const mockUser = { userId: '123', email: 'test@example.com' };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it('should throw original error when err is provided', () => {
      const mockError = new Error('Test error');

      expect(() => guard.handleRequest(mockError, null, null)).toThrow(mockError);
    });

    it('should throw UnauthorizedException with specific message for TokenExpiredError', () => {
      const info = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Token 已过期');
    });

    it('should throw UnauthorizedException with specific message for JsonWebTokenError', () => {
      const info = { name: 'JsonWebTokenError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Token 格式错误');
    });

    it('should throw UnauthorizedException with specific message for NotBeforeError', () => {
      const info = { name: 'NotBeforeError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Token 尚未生效');
    });

    it('should throw UnauthorizedException with default message when no user and no info', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, null)).toThrow('未认证或 Token 无效');
    });

    it('should throw UnauthorizedException with default message for unknown error type', () => {
      const info = { name: 'UnknownError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('未认证或 Token 无效');
    });

    it('should throw UnauthorizedException with default message when info has no name', () => {
      const info = {};

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('未认证或 Token 无效');
    });

    it('should prioritize error over missing user', () => {
      const mockError = new Error('Auth failed');
      const info = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(mockError, null, info)).toThrow(mockError);
    });

    it('should not throw when user exists regardless of info', () => {
      const mockUser = { userId: '123', email: 'test@example.com' };
      const info = { name: 'SomeError' };

      const result = guard.handleRequest(null, mockUser, info);

      expect(result).toEqual(mockUser);
    });
  });
});
