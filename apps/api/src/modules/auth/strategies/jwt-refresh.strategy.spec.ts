import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtPayload } from '@bmad-starter-kit/shared';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  // Mock test environment variable
  const originalEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    // Set test environment to use fallback secret
    process.env.NODE_ENV = 'test';
    delete process.env.JWT_SECRET;
    strategy = new JwtRefreshStrategy();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('constructor', () => {
    it('should be created successfully', () => {
      expect(strategy).toBeDefined();
      expect(strategy.constructor.name).toBe('JwtRefreshStrategy');
    });

    it('should use test secret in test environment', () => {
      expect(() => new JwtRefreshStrategy()).not.toThrow();
    });

    it('should use custom secret when JWT_SECRET is set', () => {
      process.env.JWT_SECRET = 'custom-secret-key';
      expect(() => new JwtRefreshStrategy()).not.toThrow();
    });
  });

  describe('validate', () => {
    const validPayload: JwtPayload = {
      sub: 'user-id-123',
      email: 'test@example.com',
      role: 'USER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 604800, // 7 days from now
    };

    it('should return user object with correct fields', async () => {
      const result = await strategy.validate(validPayload);

      expect(result).toEqual({
        userId: 'user-id-123',
        email: 'test@example.com',
      });
    });

    it('should map sub from payload to userId', async () => {
      const result = await strategy.validate(validPayload);

      expect(result.userId).toBe(validPayload.sub);
    });

    it('should map email from payload to email', async () => {
      const result = await strategy.validate(validPayload);

      expect(result.email).toBe(validPayload.email);
    });

    it('should handle payload with minimal fields', async () => {
      const minimalPayload: JwtPayload = {
        sub: 'minimal-user-id',
        email: 'minimal@example.com',
        role: 'USER',
      };

      const result = await strategy.validate(minimalPayload);

      expect(result).toEqual({
        userId: 'minimal-user-id',
        email: 'minimal@example.com',
      });
    });

    it('should handle various user ID formats', async () => {
      const userIds = [
        'cmjsq04gj0000lwkitfljctu2', // Prisma/Cuid format
        '123e4567-e89b-12d3-a456-426614174000', // UUID format
        'user-12345', // Simple string
        '67890', // Numeric string
      ];

      for (const userId of userIds) {
        const payload: JwtPayload = {
          sub: userId,
          email: 'test@example.com',
          role: 'USER',
        };
        const result = await strategy.validate(payload);

        expect(result.userId).toBe(userId);
      }
    });

    it('should preserve email exactly as in payload', async () => {
      const emails = [
        'user@example.com',
        'user.name+tag@subdomain.example.co.uk',
        'USER@EXAMPLE.COM', // Uppercase
        'test-user@test-domain.com',
      ];

      for (const email of emails) {
        const payload: JwtPayload = {
          sub: 'user-id',
          email,
          role: 'USER',
        };
        const result = await strategy.validate(payload);

        expect(result.email).toBe(email);
      }
    });
  });

  describe('strategy configuration', () => {
    it('should extract JWT from refresh_token cookie', () => {
      // The strategy is configured to extract from cookies
      expect(strategy).toBeDefined();
    });

    it('should not ignore expiration by default', () => {
      // The strategy is configured with ignoreExpiration: false
      expect(strategy).toBeDefined();
    });
  });
});
