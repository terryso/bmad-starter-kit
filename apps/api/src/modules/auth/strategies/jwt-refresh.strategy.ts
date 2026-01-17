import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@bmad-starter-kit/shared';

/**
 * JWT Refresh Token Strategy for Passport
 * Validates JWT refresh tokens from HttpOnly cookies
 *
 * This strategy is used to refresh access tokens using the refresh token cookie
 */

// Get JWT_SECRET or throw error in production
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV !== 'test') {
    throw new Error(
      'JWT_SECRET environment variable is required for JWT refresh strategy. ' +
      'Set it in your .env file with a strong random value.'
    );
  }
  return secret || 'test-secret-key-do-not-use-in-production';
};

/**
 * Extract refresh token from cookie
 * Handles both parsed cookies (request.cookies) and raw Cookie header
 * @param request Express request object
 * @returns Refresh token string or null
 */
const extractRefreshToken = (request: any): string | null => {
  // First try parsed cookies (cookie-parser middleware)
  if (request?.cookies?.refresh_token) {
    return request.cookies.refresh_token;
  }

  // Fallback: parse from Cookie header (for cross-origin scenarios)
  if (request?.headers?.cookie) {
    const cookies: Record<string, string> = {};
    request.headers.cookie.split(';').forEach((cookie: string) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
    return cookies.refresh_token || null;
  }

  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractRefreshToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  /**
   * Validate JWT refresh token payload
   * @param payload Decoded JWT payload
   * @returns User object attached to request.user
   */
  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
