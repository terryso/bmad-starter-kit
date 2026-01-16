import { Role } from '@prisma/client';

/**
 * User Response DTO
 *
 * Response shape for a single user in the admin users list.
 * Contains user information without sensitive data like password.
 */
export class UserResponseDto {
  /** User ID */
  id: string;

  /** User email address */
  email: string;

  /** User display name */
  name: string;

  /** User role (USER or ADMIN) */
  role: Role;

  /** Account creation timestamp */
  createdAt: Date;

  /** Last active timestamp (null if not tracked yet) */
  lastActiveAt: Date | null;
}

/**
 * Pagination metadata for users list response
 */
export interface PaginationMeta {
  /** Current page number */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of users matching the query */
  total: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * Users List Response DTO
 *
 * Response shape for the admin users list endpoint.
 * Contains both the users array and pagination metadata.
 */
export interface UsersListResponseDto {
  /** Array of users */
  users: UserResponseDto[];

  /** Pagination metadata */
  pagination: PaginationMeta;
}
