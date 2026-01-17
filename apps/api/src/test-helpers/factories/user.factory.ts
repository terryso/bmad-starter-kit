/**
 * User Data Factory for API Tests
 *
 * Generates test user data with random values using faker patterns.
 * Supports overrides for specific test scenarios.
 *
 * @module test-helpers/factories/user.factory
 */

import { Role } from '@prisma/client';

/**
 * Generate a random CUID-like string for testing
 * Format: 25 lowercase alphanumeric characters
 */
export const generateId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 25; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

/**
 * Generate a random email address
 */
export const generateEmail = (): string => {
  const domains = ['example.com', 'test.com', 'mail.com', 'demo.com'];
  const usernames = ['user', 'test', 'demo', 'admin', 'john', 'jane', 'bob', 'alice'];
  const randomNum = Math.floor(Math.random() * 10000);
  const username = usernames[Math.floor(Math.random() * usernames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}${randomNum}@${domain}`;
};

/**
 * Generate a random password (meeting minimum requirements)
 */
export const generatePassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Generate a random name
 */
export const generateName = (): string => {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

/**
 * Create a user object with optional overrides
 */
export interface CreateUserOptions {
  id?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: Role;
  createdAt?: Date;
}

export const createUser = (overrides: CreateUserOptions = {}): {
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: Role;
  createdAt: Date;
} => ({
  id: overrides.id ?? generateId(),
  email: overrides.email ?? generateEmail(),
  password: overrides.password ?? generatePassword(),
  name: overrides.name ?? generateName(),
  role: overrides.role ?? Role.USER,
  createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00.000Z'),
});

/**
 * Create a user object without password (as returned by API)
 */
export const createUserWithoutPassword = (overrides: CreateUserOptions = {}): {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
} => {
  const user = createUser(overrides);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Create multiple users
 */
export const createUsers = (count: number, overrides: CreateUserOptions = {}): ReturnType<typeof createUser>[] => {
  return Array.from({ length: count }, (_, i) =>
    createUser({
      ...overrides,
      email: overrides.email ?? `user${i}@example.com`,
    }),
  );
};

/**
 * Create multiple users without password
 */
export const createUsersWithoutPassword = (count: number, overrides: CreateUserOptions = {}): ReturnType<typeof createUserWithoutPassword>[] => {
  return Array.from({ length: count }, (_, i) =>
    createUserWithoutPassword({
      ...overrides,
      email: overrides.email ?? `user${i}@example.com`,
    }),
  );
};

/**
 * Valid test credentials (for consistent testing)
 */
export const VALID_TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: '12345678',
  name: 'Test User',
} as const;

/**
 * Admin test credentials
 */
export const ADMIN_TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin User',
} as const;

/**
 * Create a test user with valid credentials
 */
export const createTestUser = () => createUser({
  email: VALID_TEST_CREDENTIALS.email,
  password: VALID_TEST_CREDENTIALS.password,
  name: VALID_TEST_CREDENTIALS.name,
});

/**
 * Create an admin user
 */
export const createAdminUser = () => createUser({
  email: ADMIN_TEST_CREDENTIALS.email,
  password: ADMIN_TEST_CREDENTIALS.password,
  name: ADMIN_TEST_CREDENTIALS.name,
  role: Role.ADMIN,
});
