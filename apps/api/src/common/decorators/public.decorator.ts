import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking routes as public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Marks a route or controller as public, bypassing JWT authentication.
 * Use this decorator on routes that should be accessible without a valid token.
 *
 * @example
 * ```typescript
 * // Apply to entire controller
 * @Controller('public')
 * @Public()
 * export class PublicController { ... }
 *
 * // Apply to specific route
 * @Controller('auth')
 * export class AuthController {
 *   @Post('login')
 *   @Public()  // This route doesn't require authentication
 *   login() { ... }
 *
 *   @Post('logout')  // This route requires authentication
 *   logout() { ... }
 * }
 * ```
 *
 * ### Usage with JwtAuthGuard
 * The JwtAuthGuard checks for this metadata key and allows access
 * to routes marked with @Public() without validating JWT tokens.
 *
 * ### Common Public Routes
 * - POST /api/v1/auth/register - User registration
 * - POST /api/v1/auth/login - User login
 * - GET /public/videos/:id - Public video playback (future)
 * - GET /public/albums/:id - Public album playback (future)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
