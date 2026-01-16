import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Admin Guard
 *
 * A specialized guard that only allows users with ADMIN role to access protected routes.
 * This is a convenience guard that combines the functionality of RolesGuard specifically for admin access.
 *
 * Must be used AFTER JwtAuthGuard to ensure request.user is populated.
 *
 * @example
 * ```typescript
 * // Using AdminGuard directly (no @Roles() decorator needed)
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * export class AdminController {
 *   @Get('users')
 *   getUsers() { ... }
 * }
 *
 * // Alternative: Using RolesGuard with @Roles() decorator
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * export class AdminController {
 *   @Get('users')
 *   getUsers() { ... }
 * }
 * ```
 *
 * ### Behavior
 * - Checks if the authenticated user has Role.ADMIN
 * - Returns 403 Forbidden if user is not an admin
 * - Does NOT require @Roles() decorator (unlike RolesGuard)
 *
 * ### When to Use
 * - Use AdminGuard for admin-only routes (simpler, no decorator needed)
 * - Use RolesGuard with @Roles() for routes that may accept multiple roles
 *
 * ### Guard Execution Order
 * 1. JwtAuthGuard validates token and attaches user to request (401 if fails)
 * 2. AdminGuard checks user role is ADMIN (403 if fails)
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
 * @see RolesGuard for more flexible role-based access control
 * @see JwtAuthGuard for authentication
 */
@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * Determines if the request can proceed based on admin role
   * @param context Execution context containing request details
   * @returns Boolean indicating if access is granted
   * @throws ForbiddenException if user is not an admin
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (shouldn't happen if JwtAuthGuard is used first), deny
    if (!user) {
      return false;
    }

    // Check if user has ADMIN role
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
