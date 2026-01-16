import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@bmad-starter-kit/shared';

/**
 * JWT Strategy for Passport
 * Validates JWT tokens from Authorization header
 *
 * This strategy is used by JwtAuthGuard (Story 2.3) to protect routes
 */

// Get JWT_SECRET or throw error in production
// In test environment, allow fallback to prevent test failures
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV !== 'test') {
    throw new Error(
      'JWT_SECRET environment variable is required for JWT strategy. ' +
      'Set it in your .env file with a strong random value.'
    );
  }
  return secret || 'test-secret-key-do-not-use-in-production';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  /**
   * Validate JWT payload
   * This method is called automatically by Passport after JWT verification
   * @param payload Decoded JWT payload
   * @returns User object attached to request.user
   */
  async validate(payload: JwtPayload) {
    // Return the payload data which will be attached to request.user
    // Include role for authorization checks in RolesGuard and AdminGuard
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
