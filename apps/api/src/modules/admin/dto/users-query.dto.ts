import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * Users Query DTO
 *
 * Query parameters for the admin users list endpoint.
 * Provides pagination, search, and filtering capabilities.
 *
 * ## Validation Rules
 * - page: Must be >= 1 (default: 1)
 * - pageSize: Must be 1-100 (default: 20)
 * - limit: Alias for pageSize (for backward compatibility)
 * - search: Optional string for email search
 * - role: Optional role filter (USER or ADMIN)
 *
 * @example
 * ```typescript
 * // Get first page of 20 users
 * GET /api/v1/admin/users
 *
 * // Get second page with 50 items per page
 * GET /api/v1/admin/users?page=2&pageSize=50
 *
 * // Search users by email
 * GET /api/v1/admin/users?search=admin@example.com
 *
 * // Filter by role
 * GET /api/v1/admin/users?role=ADMIN
 * ```
 */
export class UsersQueryDto {
  /**
   * Page number for pagination
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of items per page
   * @default 20
   * @maximum 100
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  /**
   * Alias for pageSize (for backward compatibility with tests)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Search term for email (case-insensitive partial match)
   * @example "admin@example.com"
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter by user role
   */
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: Role;
}
