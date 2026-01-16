import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Metadata key for storing required roles on route handlers
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Marks a route or controller as requiring specific user roles.
 * Use this decorator with RolesGuard to restrict access based on user role.
 *
 * @example
 * ```typescript
 * // Apply to entire controller
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * export class AdminController { ... }
 *
 * // Apply to specific route
 * @Controller('settings')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class SettingsController {
 *   @Get('general')
 *   @Roles(Role.USER, Role.ADMIN)  // Both roles can access
 *   getGeneralSettings() { ... }
 *
 *   @Get('admin')
 *   @Roles(Role.ADMIN)  // Only admins can access
 *   getAdminSettings() { ... }
 * }
 * ```
 *
 * ### Usage with RolesGuard
 * The RolesGuard checks for this metadata key and compares the required roles
 * with the current user's role from request.user.
 *
 * ### Guard Order
 * Always use RolesGuard AFTER JwtAuthGuard to ensure the user is authenticated first:
 * - JwtAuthGuard validates the token (401 if failed)
 * - RolesGuard checks the user's role (403 if failed)
 *
 * ### Common Role Combinations
 * - `@Roles(Role.ADMIN)` - Admin only
 * - `@Roles(Role.USER)` - Any authenticated user
 * - `@Roles(Role.USER, Role.ADMIN)` - Explicitly allow both (same as USER only)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
