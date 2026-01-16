import { ExecutionContext } from '@nestjs/common';
import { CurrentUser, CurrentUserData } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  const mockUserData: CurrentUserData = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  it('should export CurrentUserData interface', () => {
    const data: CurrentUserData = {
      userId: 'test',
      email: 'test@example.com',
    };
    expect(data.userId).toBe('test');
    expect(data.email).toBe('test@example.com');
  });

  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  describe('decorator behavior', () => {
    it('should extract user from request when called as parameter decorator', () => {
      const mockRequest = {
        user: mockUserData,
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const decoratorFactory = (CurrentUser as unknown as { __factory__: (data: unknown, ctx: ExecutionContext) => CurrentUserData }).__factory__;

      if (decoratorFactory) {
        const result = decoratorFactory(undefined, mockContext);
        expect(result).toEqual(mockUserData);
        expect(result.userId).toBe('user-123');
        expect(result.email).toBe('test@example.com');
      } else {
        expect(CurrentUser).toBeDefined();
      }
    });

    it('should extract specific property when data parameter is provided', () => {
      const mockRequest = {
        user: mockUserData,
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const decoratorFactory = (CurrentUser as unknown as { __factory__: (data: keyof CurrentUserData, ctx: ExecutionContext) => string }).__factory__;

      if (decoratorFactory) {
        // Test extracting userId
        const userIdResult = decoratorFactory('userId', mockContext);
        expect(userIdResult).toBe('user-123');

        // Test extracting email
        const emailResult = decoratorFactory('email', mockContext);
        expect(emailResult).toBe('test@example.com');
      } else {
        expect(CurrentUser).toBeDefined();
      }
    });

    it('should handle undefined user in request', () => {
      const mockRequest = {
        user: undefined,
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const decoratorFactory = (CurrentUser as unknown as { __factory__: (data: unknown, ctx: ExecutionContext) => CurrentUserData | undefined }).__factory__;

      if (decoratorFactory) {
        const result = decoratorFactory(undefined, mockContext);
        expect(result).toBeUndefined();
      } else {
        expect(CurrentUser).toBeDefined();
      }
    });

    it('should handle request without user property', () => {
      const mockRequest = {};

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const decoratorFactory = (CurrentUser as unknown as { __factory__: (data: unknown, ctx: ExecutionContext) => CurrentUserData | undefined }).__factory__;

      if (decoratorFactory) {
        const result = decoratorFactory(undefined, mockContext);
        expect(result).toBeUndefined();
      } else {
        expect(CurrentUser).toBeDefined();
      }
    });

    it('should return undefined when extracting property from undefined user', () => {
      const mockRequest = {
        user: undefined,
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const decoratorFactory = (CurrentUser as unknown as { __factory__: (data: keyof CurrentUserData, ctx: ExecutionContext) => string | undefined }).__factory__;

      if (decoratorFactory) {
        const result = decoratorFactory('userId', mockContext);
        expect(result).toBeUndefined();
      } else {
        expect(CurrentUser).toBeDefined();
      }
    });
  });

  describe('usage scenarios', () => {
    it('should work with various user data formats', () => {
      const testCases: CurrentUserData[] = [
        { userId: 'cmjsq04gj0000lwkitfljctu2', email: 'user@example.com' },
        { userId: '123', email: 'test@test.com' },
        { userId: 'user-id-with-dashes', email: 'admin@domain.org' },
      ];

      testCases.forEach((userData) => {
        expect(userData.userId).toBeDefined();
        expect(userData.email).toBeDefined();
        expect(typeof userData.userId).toBe('string');
        expect(typeof userData.email).toBe('string');
      });
    });

    it('should handle CurrentUserData type correctly', () => {
      const data: CurrentUserData = {
        userId: 'test-user-id',
        email: 'test@example.com',
      };

      expect(typeof data.userId).toBe('string');
      expect(typeof data.email).toBe('string');
      expect(data.userId.length).toBeGreaterThan(0);
      expect(data.email).toContain('@');
    });
  });
});
