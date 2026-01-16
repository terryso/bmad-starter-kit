import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { UsersQueryDto } from './dto/users-query.dto';
import type { UsersListResponseDto } from './dto/user-response.dto';
import type { SystemStatsDto } from './dto/stats-response.dto';

/**
 * Admin Controller
 *
 * Handles administrative endpoints for managing users and system data.
 * All routes require ADMIN role and JWT authentication.
 *
 * ## Security
 * - All routes protected by JwtAuthGuard (validates JWT token)
 * - All routes protected by RolesGuard (validates ADMIN role)
 * - Non-admin users receive 403 Forbidden
 * - Unauthenticated users receive 401 Unauthorized
 *
 * ## Routes
 * - GET /api/v1/admin/users - Get all users with pagination and filtering
 * - GET /api/v1/admin/stats - Get system statistics
 *
 * ## Guard Execution Order
 * 1. JwtAuthGuard validates token and attaches user to request
 * 2. RolesGuard checks user has ADMIN role
 *
 * @see AdminService
 * @see JwtAuthGuard
 * @see RolesGuard
 */
@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get All Users
   *
   * Returns a paginated list of all users in the system.
   * Requires ADMIN role.
   *
   * ## Query Parameters
   * - page: Page number (default: 1, min: 1)
   * - pageSize: Items per page (default: 20, min: 1, max: 100)
   * - search: Search term for email (case-insensitive partial match)
   * - role: Filter by role (USER or ADMIN)
   *
   * ## Response Format
   * Returns users array with pagination metadata.
   * Each user includes: id, email, name, role, createdAt, lastActiveAt
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   *
   * @param query Query parameters for filtering and pagination
   * @returns Paginated users list
   *
   * @example
   * ```bash
   * # Get first page of users
   * curl -X GET "http://localhost:3000/api/v1/admin/users" \
   *   -H "Authorization: Bearer <admin-token>"
   *
   * # Search for users by email
   * curl -X GET "http://localhost:3000/api/v1/admin/users?search=admin@example.com" \
   *   -H "Authorization: Bearer <admin-token>"
   *
   * # Filter by role
   * curl -X GET "http://localhost:3000/api/v1/admin/users?role=USER&page=1&pageSize=50" \
   *   -H "Authorization: Bearer <admin-token>"
   * ```
   */
  @Get('users')
  async findAllUsers(
    @Query() query: UsersQueryDto,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<UsersListResponseDto> {
    // Current user ID is passed for audit/logging purposes
    return this.adminService.findAllUsers(query, currentUserId);
  }

  /**
   * Get System Statistics
   *
   * Returns aggregated statistics about the platform.
   * Requires ADMIN role.
   *
   * ## Statistics Included
   * - Total users
   * - New users today
   * - New users this month
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   *
   * @returns System statistics object
   *
   * @example
   * ```bash
   * curl -X GET "http://localhost:3000/api/v1/admin/stats" \
   *   -H "Authorization: Bearer <admin-token>"
   * ```
   */
  @Get('stats')
  async getStats(): Promise<{ data: SystemStatsDto; statusCode: number; message: string }> {
    const stats = await this.adminService.getStats();
    return {
      data: stats,
      statusCode: 200,
      message: 'success',
    };
  }
}
