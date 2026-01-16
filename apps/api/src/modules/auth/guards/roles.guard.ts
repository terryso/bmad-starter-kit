import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../../common/decorators';

/**
 * Roles Guard
 *
 * Protects routes by validating that authenticated users have required roles.
 * Must be used AFTER JwtAuthGuard to ensure request.user is populated.
 *
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)  // Order matters!
 * @Roles(Role.ADMIN)
 * export class AdminController {
 *   @Get('users')
 *   getUsers() { ... }
 * }
 * ```
 *
 * ### Behavior
 * - Extracts required roles from @Roles() decorator metadata
 * - Compares current user's role (from request.user) with required roles
 * - Returns 403 Forbidden if user lacks required role
 * - Allows access if no roles are specified (delegates to other guards)
 *
 * ### Guard Execution Order
 * 1. JwtAuthGuard validates token and attaches user to request (401 if fails)
 * 2. RolesGuard checks user role (403 if fails)
 *
 * ### Error Response
 * ```json
 * {
 *   "statusCode": 403,
 *   "message": "需要管理员权限",
 *   "error": "Forbidden"
 * }
 * ```
 *
 * @see Roles decorator
 * @see JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the request can proceed based on user roles
   * @param context Execution context containing request details
   * @returns Boolean indicating if access is granted
   * @throws ForbiddenException if user lacks required role
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata (check handler first, then class)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access (delegates to other guards)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (shouldn't happen if JwtAuthGuard is used first), deny
    if (!user) {
      return false;
    }

    // Check if user's role matches any of the required roles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
