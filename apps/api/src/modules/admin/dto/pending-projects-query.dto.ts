import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@bmad-starter-kit/shared';

/**
 * Pending Projects Query DTO
 *
 * Query parameters for the admin pending projects list endpoint.
 * Provides pagination for viewing projects awaiting review.
 *
 * ## Validation Rules
 * - page: Must be >= 1 (default: 1)
 * - pageSize: Must be >= 1 (default: 12)
 *
 * @example
 * ```typescript
 * // Get first page of pending projects
 * GET /api/v1/admin/showcase/pending
 *
 * // Get second page with 24 items per page
 * GET /api/v1/admin/showcase/pending?page=2&pageSize=24
 * ```
 */
export class PendingProjectsQueryDto {
  /**
   * Page number for pagination
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  /**
   * Number of items per page
   * @default 12
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
