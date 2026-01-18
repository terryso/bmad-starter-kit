/**
 * System Statistics Response
 *
 * Response shape for the admin stats endpoint.
 * Contains aggregated statistics about the platform.
 */
export class SystemStatsDto {
  /** Total number of registered users */
  totalUsers: number;

  /** Number of new users registered today (since midnight) */
  newUsersToday: number;

  /** Number of new users registered this month */
  newUsersThisMonth: number;

  /** Total number of projects in showcase */
  totalProjects: number;
}

/**
 * Stats Response DTO
 *
 * Unified response format for the stats endpoint.
 * Follows the project's standard API response pattern.
 */
export interface StatsResponseDto {
  /** HTTP status code */
  statusCode: number;

  /** Response message */
  message: string;

  /** System statistics data */
  data: SystemStatsDto;
}
