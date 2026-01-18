/**
 * System Statistics for BMAD Showcase Platform
 */
export interface SystemStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  totalProjects: number;
  pendingProjects: number;
  totalStars: number;
  newProjectsToday: number;
}

/**
 * User List Item
 */
export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  lastActiveAt: Date | null;
}

/**
 * Pagination Meta
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Users List Response
 */
export interface UsersListResponse {
  users: UserListItem[];
  pagination: PaginationMeta;
}

/**
 * Users Query DTO
 */
export interface UsersQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: 'USER' | 'ADMIN';
}
