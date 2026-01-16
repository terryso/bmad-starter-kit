import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators';

/**
 * JWT Authentication Guard
 *
 * Protects routes by validating JWT tokens from the Authorization header.
 * Uses the underlying JwtStrategy for token validation.
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController {
 *   @Get('me')
 *   getCurrentUser() { ... }
 * }
 * ```
 *
 * ### Behavior
 * - Extracts Bearer token from Authorization header
 * - Validates token signature and expiration
 * - Attaches user data to request.user
 * - Throws 401 if token is missing, invalid, or expired
 *
 * @see JwtStrategy
 * @see CurrentUser decorator
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the request can proceed
   * @param context Execution context containing request details
   * @returns Boolean or Promise resolving to boolean
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> {
    // Check if route is marked as public (bypass authentication)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Cast to satisfy TypeScript - AuthGuard returns boolean | Promise | Observable
    return super.canActivate(context) as Promise<boolean>;
  }

  /**
   * Handles authentication result
   * Called by Passport after authentication attempt
   *
   * @param err Error from Passport/JWT validation
   * @param user User object from validate() in JwtStrategy
   * @param info Additional info from Passport (e.g., token expired message)
   * @returns User object if authenticated
   * @throws UnauthorizedException if authentication fails
   */
  handleRequest(err: any, user: any, info: any) {
    // If there's an error, throw it directly
    if (err) {
      throw err;
    }

    // No user means authentication failed
    if (!user) {
      // Provide specific error messages based on Passport info
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token 已过期');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token 格式错误');
      }
      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token 尚未生效');
      }
      // Default error message
      throw new UnauthorizedException('未认证或 Token 无效');
    }

    return user;
  }
}
