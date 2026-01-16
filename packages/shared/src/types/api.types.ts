/**
 * Generic API Response
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * API Error Response
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  errors?: ValidationError[];
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Pagination Params
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Success Response
 */
export interface SuccessResponse {
  statusCode: number;
  message: string;
}

/**
 * Delete Response
 */
export interface DeleteResponse {
  statusCode: number;
  message: string;
}

/**
 * ID Response
 */
export interface IdResponse {
  id: string;
}
