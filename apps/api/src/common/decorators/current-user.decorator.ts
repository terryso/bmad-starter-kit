import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * User data attached to request by JwtAuthGuard
 * Contains the minimal user info from JWT payload
 */
export interface CurrentUserData {
  /** User ID from JWT subject claim */
  userId: string;
  /** User email from JWT payload */
  email: string;
}

/**
 * CurrentUser Decorator
 *
 * Extracts the authenticated user from the request object.
 * The user is attached to request.user by JwtAuthGuard.
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController {
 *   @Get('me')
 *   getCurrentUser(@CurrentUser() user: CurrentUserData) {
 *     return {
 *       id: user.userId,
 *       email: user.email,
 *     };
 *   }
 * }
 * ```
 *
 * ### Type Safety
 * Use the `CurrentUserData` interface for proper typing:
 * ```typescript
 * import type { CurrentUserData } from '@/common/decorators/current-user.decorator';
 * ```
 *
 * @see JwtAuthGuard
 * @see JwtStrategy
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    // If data (property name) is provided, return that specific property
    // Otherwise return the entire user object
    return data ? user[data] : user;
  },
);
