/**
 * User Role Enum
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * User Entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Register DTO
 */
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

/**
 * Login DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Update User DTO
 */
export interface UpdateUserDto {
  name?: string;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Token Payload
 */
export interface TokenPayload {
  accessToken: string;
}

/**
 * Login Response DTO
 */
export interface LoginResponseDto {
  user: User;
  accessToken: string;
}

/**
 * User Response
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}
