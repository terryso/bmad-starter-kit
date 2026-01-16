import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersQueryDto } from './dto/users-query.dto';
import type { UsersListResponseDto } from './dto/user-response.dto';
import type { SystemStatsDto } from './dto/stats-response.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@bmad-starter-kit/shared';

/**
 * Admin Service
 *
 * Handles administrative operations for user management.
 * All methods require the user to have ADMIN role.
 */
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
      this.prisma.user.findMany({
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
      this.prisma.user.count({ where }),
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
   * Returns user statistics about the system.
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
    const [totalUsers, newUsersToday, newUsersThisMonth] = await Promise.all([
      // Total users
      this.prisma.user.count(),

      // New users today
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      }),

      // New users this month
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
      }),
    ]);

    return {
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
    };
  }
}
