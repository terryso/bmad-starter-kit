import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserData } from '../common/decorators';
import { UpdateProfileDto } from './dto/update-profile.dto';

/**
 * UsersController
 *
 * Handles user-related HTTP endpoints.
 * All endpoints are protected by JWT authentication.
 *
 * Routes:
 * - GET /api/v1/users - Get current user profile (alias for /me)
 * - GET /api/v1/users/me - Get current user profile
 * - PUT /api/v1/users - Update current user profile (name only)
 */
@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   *
   * @route GET /api/v1/users
   * @guard JwtAuthGuard
   * @param user Current user from JWT token
   * @returns Current user profile data
   *
   * @example
   * ```bash
   * curl -X GET http://localhost:3000/api/v1/users \
   *   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   * ```
   *
   * Response:
   * ```json
   * {
   *   "statusCode": 200,
   *   "message": "获取用户信息成功",
   *   "data": {
   *     "id": "user-id",
   *     "email": "user@example.com",
   *     "name": "User Name",
   *     "createdAt": "2025-01-01T00:00:00.000Z"
   *   }
   * }
   * ```
   */
  @Get()
  async getProfile(@CurrentUser() user: CurrentUserData) {
    const fullUser = await this.usersService.getCurrentUser(user.userId);

    return {
      statusCode: 200,
      message: '获取用户信息成功',
      data: fullUser,
    };
  }

  /**
   * Get current user profile (alias endpoint)
   *
   * @route GET /api/v1/users/me
   * @guard JwtAuthGuard
   * @param user Current user from JWT token
   * @returns Current user profile data
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    const fullUser = await this.usersService.getCurrentUser(user.userId);

    return {
      statusCode: 200,
      message: '获取当前用户信息成功',
      data: fullUser,
    };
  }

  /**
   * Update current user profile
   *
   * Only the name field can be updated. Email is read-only.
   *
   * @route PUT /api/v1/users
   * @guard JwtAuthGuard
   * @param user Current user from JWT token
   * @param updateProfileDto DTO containing name field (optional)
   * @returns Updated user profile data
   *
   * @example
   * ```bash
   * curl -X PUT http://localhost:3000/api/v1/users \
   *   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
   *   -H "Content-Type: application/json" \
   *   -d '{"name": "New Name"}'
   * ```
   *
   * Response:
   * ```json
   * {
   *   "statusCode": 200,
   *   "message": "更新用户信息成功",
   *   "data": {
   *     "id": "user-id",
   *     "email": "user@example.com",
   *     "name": "New Name",
   *     "createdAt": "2025-01-01T00:00:00.000Z"
   *   }
   * }
   * ```
   */
  @Put()
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      user.userId,
      updateProfileDto.name,
    );

    return {
      statusCode: 200,
      message: '更新用户信息成功',
      data: updatedUser,
    };
  }
}
