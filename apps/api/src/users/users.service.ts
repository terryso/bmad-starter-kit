import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserResponse } from '@bmad-starter-kit/shared';

/**
 * UsersService
 *
 * Handles user-related business logic including:
 * - Fetching user by ID
 * - User profile management (get and update)
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user by ID
   * @param userId User ID to fetch
   * @returns User data without password
   * @throws NotFoundException if user not found
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Exclude password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      name: userWithoutPassword.name,
      role: userWithoutPassword.role,
      createdAt: userWithoutPassword.createdAt,
    };
  }

  /**
   * Get current user's profile
   * Convenience method that calls getUserById
   * @param userId User ID from JWT token
   * @returns User data without password
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    return this.getUserById(userId);
  }

  /**
   * Update current user's profile
   * Only the name field can be updated (email is read-only)
   *
   * Behavior:
   * - If name is provided: updates the user's name and returns updated data
   * - If name is undefined: returns current user data (no-op, no DB write)
   * - If name is empty/whitespace: throws BadRequestException
   *
   * @param userId User ID from JWT token
   * @param name New name value (optional)
   * @returns Updated user data without password
   * @throws NotFoundException if user not found
   * @throws BadRequestException if name is empty string
   */
  async updateProfile(userId: string, name?: string): Promise<UserResponse> {
    // If no name provided, return current user data (no-op behavior)
    if (name === undefined) {
      return this.getCurrentUser(userId);
    }

    // Validate: reject empty or whitespace-only strings
    if (name.trim() === '') {
      throw new BadRequestException('姓名不能为空');
    }

    // Perform the update
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    // Exclude password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      name: userWithoutPassword.name,
      role: userWithoutPassword.role,
      createdAt: userWithoutPassword.createdAt,
    };
  }
}
