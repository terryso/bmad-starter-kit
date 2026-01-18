import { Controller, Get, Query, UseGuards, Param, Patch, Delete, Body, HttpCode, HttpStatus, NotFoundException, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AdminService, PendingProjectsListResponse, PendingProjectResponse } from './admin.service';
import { UsersQueryDto } from './dto/users-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PendingProjectsQueryDto } from './dto/pending-projects-query.dto';
import { RejectProjectDto } from './dto/reject-project.dto';
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
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: any; statusCode: number; message: string }> {
    // Current user ID is passed for audit/logging purposes
    // Handle limit as alias for pageSize
    const effectiveQuery = { ...query, pageSize: query.limit || query.pageSize };
    const result = await this.adminService.findAllUsers(effectiveQuery, currentUserId);

    // Check if pagination params were explicitly provided in the request (before defaults)
    const hasPagination = page !== undefined || pageSize !== undefined || limit !== undefined;

    if (hasPagination) {
      // Return paginated format with items and metadata
      return {
        data: {
          items: result.users,
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.pageSize,
          totalPages: result.pagination.totalPages,
        },
        statusCode: 200,
        message: 'success',
      };
    } else {
      // Return simple array format (for backward compatibility)
      return {
        data: result.users,
        statusCode: 200,
        message: 'success',
      };
    }
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

  /**
   * Update User Role
   *
   * Modifies the role of a specific user.
   * Requires ADMIN role.
   *
   * ## Path Parameters
   * - id: User ID to modify
   *
   * ## Request Body
   * - role: New role (USER or ADMIN)
   *
   * ## Response Format
   * Returns updated user with new role.
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   * - Cannot modify own role (400 if attempted)
   *
   * @param userId User ID to modify
   * @param updateRoleDto New role assignment
   * @param currentUserId Current admin user ID
   * @returns Updated user with new role
   *
   * @example
   * ```bash
   * curl -X PATCH "http://localhost:3000/api/v1/admin/users/123/role" \
   *   -H "Authorization: Bearer <admin-token>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"role": "ADMIN"}'
   * ```
   */
  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ data: { id: string; role: Role }; statusCode: number; message: string }> {
    const updatedUser = await this.adminService.updateUserRole(userId, updateRoleDto, currentUserId);
    return {
      data: updatedUser,
      statusCode: 200,
      message: 'User role updated successfully',
    };
  }

  /**
   * Delete User
   *
   * Permanently deletes a user from the system.
   * Requires ADMIN role.
   *
   * ## Path Parameters
   * - id: User ID to delete
   *
   * ## Response Format
   * Returns 204 No Content on success.
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   * - Cannot delete own account (400 if attempted)
   *
   * @param userId User ID to delete
   * @param currentUserId Current admin user ID
   *
   * @example
   * ```bash
   * curl -X DELETE "http://localhost:3000/api/v1/admin/users/123" \
   *   -H "Authorization: Bearer <admin-token>"
   * ```
   */
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<void> {
    await this.adminService.deleteUser(userId, currentUserId);
  }

  /**
   * Get Pending Projects
   *
   * Returns a paginated list of projects awaiting admin review.
   * Only projects with PENDING status are returned.
   * Requires ADMIN role.
   *
   * ## Query Parameters
   * - page: Page number (default: 1, min: 1)
   * - pageSize: Items per page (default: 12, min: 1)
   *
   * ## Response Format
   * Returns paginated list of pending projects with submitter information.
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   *
   * @param query Query parameters for pagination
   * @returns Paginated pending projects list
   *
   * @example
   * ```bash
   * curl -X GET "http://localhost:3000/api/v1/admin/showcase/pending" \
   *   -H "Authorization: Bearer <admin-token>"
   *
   * curl -X GET "http://localhost:3000/api/v1/admin/showcase/pending?page=2&pageSize=24" \
   *   -H "Authorization: Bearer <admin-token>"
   * ```
   */
  @Get('showcase/pending')
  async getPendingProjects(
    @Query() query: PendingProjectsQueryDto,
  ): Promise<{ data: PendingProjectsListResponse; statusCode: number; message: string }> {
    const result = await this.adminService.getPendingProjects(query);
    return {
      data: result,
      statusCode: 200,
      message: '获取待审核项目成功',
    };
  }

  /**
   * Get Pending Projects Count
   *
   * Returns the total number of projects awaiting review.
   * Used for displaying badge counts in the admin UI.
   * Requires ADMIN role.
   *
   * ## Response Format
   * Returns count of pending projects.
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   *
   * @returns Count of pending projects
   *
   * @example
   * ```bash
   * curl -X GET "http://localhost:3000/api/v1/admin/showcase/pending/count" \
   *   -H "Authorization: Bearer <admin-token>"
   * ```
   */
  @Get('showcase/pending/count')
  async getPendingProjectsCount(): Promise<{
    data: { count: number };
    statusCode: number;
    message: string;
  }> {
    const count = await this.adminService.getPendingProjectsCount();
    return {
      data: { count },
      statusCode: 200,
      message: '获取待审核数量成功',
    };
  }

  /**
   * Approve Project
   *
   * Approves a pending project, changing its status to APPROVED.
   * Records the admin user who approved and the timestamp.
   * Requires ADMIN role.
   *
   * ## Path Parameters
   * - id: Project ID to approve
   *
   * ## Response Format
   * Returns updated project information.
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   *
   * @param id Project ID to approve
   * @param adminUserId ID of the admin performing the approval
   * @returns Updated project information
   *
   * @example
   * ```bash
   * curl -X PUT "http://localhost:3000/api/v1/admin/showcase/clxx.../approve" \
   *   -H "Authorization: Bearer <admin-token>"
   * ```
   */
  @Put('showcase/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveProject(
    @Param('id') id: string,
    @CurrentUser('userId') adminUserId: string,
  ): Promise<{ data: PendingProjectResponse; statusCode: number; message: string }> {
    const project = await this.adminService.approveProject(id, adminUserId);
    return {
      data: project,
      statusCode: 200,
      message: '项目已批准',
    };
  }

  /**
   * Reject Project
   *
   * Rejects a pending project with a reason.
   * Changes status to REJECTED and records the reason, admin, and timestamp.
   * Requires ADMIN role.
   *
   * ## Path Parameters
   * - id: Project ID to reject
   *
   * ## Request Body
   * - rejectionReason: Reason for rejection (required, min 5 characters)
   *
   * ## Response Format
   * Returns updated project information.
   *
   * ## Security
   * - Requires valid JWT token (401 if missing/invalid)
   * - Requires ADMIN role (403 if not admin)
   *
   * @param id Project ID to reject
   * @param rejectDto Rejection reason
   * @param adminUserId ID of the admin performing the rejection
   * @returns Updated project information
   *
   * @example
   * ```bash
   * curl -X PUT "http://localhost:3000/api/v1/admin/showcase/clxx.../reject" \
   *   -H "Authorization: Bearer <admin-token>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"rejectionReason": "项目描述不完整，请补充更多技术细节"}'
   * ```
   */
  @Put('showcase/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectProject(
    @Param('id') id: string,
    @Body() rejectDto: RejectProjectDto,
    @CurrentUser('userId') adminUserId: string,
  ): Promise<{ data: PendingProjectResponse; statusCode: number; message: string }> {
    const project = await this.adminService.rejectProject(id, rejectDto, adminUserId);
    return {
      data: project,
      statusCode: 200,
      message: '项目已拒绝',
    };
  }
}
