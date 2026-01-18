import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersQueryDto } from './dto/users-query.dto';
import type { UsersListResponseDto } from './dto/user-response.dto';
import type { SystemStatsDto } from './dto/stats-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PendingProjectsQueryDto } from './dto/pending-projects-query.dto';
import { RejectProjectDto } from './dto/reject-project.dto';
import { Role } from '@prisma/client';
import { ProjectStatus } from '../showcase/showcase.service';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@bmad-starter-kit/shared';

/**
 * Pending Project Response Interface
 *
 * Project data returned for admin review, includes submitter information
 */
export interface PendingProjectResponse {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  category: string;
  topics: string[];
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

/**
 * Pending Projects List Response
 */
export interface PendingProjectsListResponse {
  items: PendingProjectResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Admin Service
 *
 * Handles administrative operations for user management.
 * All methods require the user to have ADMIN role.
 */
@Injectable()
export class AdminService {
  // Type assertion for Prisma models
  private readonly prismaUser: any;
  private readonly prismaProject: any;

  constructor(private prisma: PrismaService) {
    this.prismaUser = (this.prisma as any).user;
    this.prismaProject = (this.prisma as any).project;
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAllUsers(
    query: UsersQueryDto,
    _currentUserId: string,
  ): Promise<UsersListResponseDto> {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, search, role } = query;

    // Build where clause for filtering
    const where: Record<string, unknown> = {};

    // Email search (case-insensitive for PostgreSQL)
    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Calculate pagination - enforce MAX_PAGE_SIZE limit
    const limitedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const skip = (page - 1) * limitedPageSize;

    // Parallel queries for data and count (better performance)
    const [users, total] = await Promise.all([
      this.prismaUser.findMany({
        where,
        skip,
        take: limitedPageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaUser.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastActiveAt: null,
      })),
      pagination: {
        page,
        pageSize: limitedPageSize,
        total,
        totalPages: Math.ceil(total / limitedPageSize),
      },
    };
  }

  /**
   * Get System Statistics
   *
   * Returns user and project statistics about the system.
   * All counts are calculated in real-time on each request.
   */
  async getStats(): Promise<SystemStatsDto> {
    // Get today's start (midnight) for "today" calculations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get month start for "this month" calculations
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Parallel queries for optimal performance
    const [totalUsers, newUsersToday, newUsersThisMonth, totalProjects] = await Promise.all([
      // Total users
      this.prismaUser.count(),

      // New users today
      this.prismaUser.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      }),

      // New users this month
      this.prismaUser.count({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
      }),

      // Total projects in showcase
      this.prismaProject.count(),
    ]);

    return {
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      totalProjects,
    };
  }

  /**
   * Update User Role
   *
   * Modifies the role of a specific user.
   * Admins cannot modify their own role to prevent accidental lockout.
   */
  async updateUserRole(userId: string, updateRoleDto: UpdateRoleDto, adminUserId: string): Promise<{ id: string; role: Role }> {
    // Check if user exists
    const user = await this.prismaUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent admin from modifying their own role
    if (userId === adminUserId) {
      throw new BadRequestException('Cannot modify your own role');
    }

    // Update user role
    const updatedUser = await this.prismaUser.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
      select: { id: true, role: true },
    });

    return updatedUser;
  }

  /**
   * Delete User
   *
   * Permanently deletes a user from the system.
   * Admins cannot delete themselves to prevent accidental lockout.
   */
  async deleteUser(userId: string, adminUserId: string): Promise<void> {
    // Check if user exists
    const user = await this.prismaUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent admin from deleting themselves
    if (userId === adminUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Delete the user (cascade delete will handle related records)
    await this.prismaUser.delete({
      where: { id: userId },
    });
  }

  /**
   * Get Pending Projects
   *
   * Returns a paginated list of projects awaiting admin review.
   * Only projects with PENDING status are returned.
   *
   * @param query Pagination parameters
   * @returns Paginated list of pending projects with submitter info
   */
  async getPendingProjects(
    query: PendingProjectsQueryDto,
  ): Promise<PendingProjectsListResponse> {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prismaProject.findMany({
        where: {
          status: ProjectStatus.PENDING,
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          repositoryName: true,
          description: true,
          owner: true,
          stars: true,
          language: true,
          category: true,
          topics: true,
          suggestedTags: true,
          screenshotUrl: true,
          githubUrl: true,
          submittedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc', // Oldest submissions first
        },
      }),
      this.prismaProject.count({
        where: {
          status: ProjectStatus.PENDING,
        },
      }),
    ]);

    // Map Prisma relation names to API response field names
    const mappedItems = items.map((item: any) => ({
      ...item,
      submittedBy: item.submittedByUser,
      submittedByUser: undefined,
    }));

    return {
      items: mappedItems,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get Pending Projects Count
   *
   * Returns the total number of projects awaiting review.
   * Used for displaying badge counts in the admin UI.
   *
   * @returns Count of pending projects
   */
  async getPendingProjectsCount(): Promise<number> {
    return this.prismaProject.count({
      where: {
        status: ProjectStatus.PENDING,
      },
    });
  }

  /**
   * Approve Project
   *
   * Approves a pending project, changing its status to APPROVED.
   * Records the admin user who approved and the timestamp.
   *
   * @param id Project ID to approve
   * @param adminUserId ID of the admin performing the approval
   * @returns Updated project information
   * @throws NotFoundException if project doesn't exist
   * @throws BadRequestException if project is not in PENDING status
   */
  async approveProject(
    id: string,
    adminUserId: string,
  ): Promise<PendingProjectResponse> {
    // Check if project exists and is in PENDING status
    const project = await this.prismaProject.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve project with status ${project.status}`,
      );
    }

    // Update project status to APPROVED
    const updated = await this.prismaProject.update({
      where: { id },
      data: {
        status: ProjectStatus.APPROVED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        repositoryName: true,
        description: true,
        owner: true,
        stars: true,
        language: true,
        category: true,
        topics: true,
        suggestedTags: true,
        screenshotUrl: true,
        githubUrl: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    // Map Prisma relation name to API response field name
    return {
      ...updated,
      submittedBy: updated.submittedByUser,
      submittedByUser: undefined,
    } as PendingProjectResponse;
  }

  /**
   * Reject Project
   *
   * Rejects a pending project with a reason.
   * Changes status to REJECTED and records the reason, admin, and timestamp.
   *
   * @param id Project ID to reject
   * @param rejectDto Rejection reason
   * @param adminUserId ID of the admin performing the rejection
   * @returns Updated project information
   * @throws NotFoundException if project doesn't exist
   * @throws BadRequestException if project is not in PENDING status
   */
  async rejectProject(
    id: string,
    rejectDto: RejectProjectDto,
    adminUserId: string,
  ): Promise<PendingProjectResponse> {
    // Check if project exists and is in PENDING status
    const project = await this.prismaProject.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject project with status ${project.status}`,
      );
    }

    // Update project status to REJECTED with reason
    const updated = await this.prismaProject.update({
      where: { id },
      data: {
        status: ProjectStatus.REJECTED,
        rejectionReason: rejectDto.rejectionReason,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        repositoryName: true,
        description: true,
        owner: true,
        stars: true,
        language: true,
        category: true,
        topics: true,
        suggestedTags: true,
        screenshotUrl: true,
        githubUrl: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    // Map Prisma relation name to API response field name
    return {
      ...updated,
      submittedBy: updated.submittedByUser,
      submittedByUser: undefined,
    } as PendingProjectResponse;
  }
}
