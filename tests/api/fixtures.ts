/**
 * API 测试 Fixtures
 *
 * 专为 API 集成测试设计的 fixtures
 * - 不需要浏览器
 * - 快速执行
 * - 使用 request context 进行 HTTP 调用
 */
import { test as base, APIRequestContext } from '@playwright/test';

/**
 * API 配置
 */
declare const process: { env: { API_URL?: string } };
export const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * 认证用户数据类型
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  password: string;
  accessToken: string;
}

/**
 * API 测试 Fixture 类型定义
 */
export type ApiTestFixtures = {
  api: APIRequestContext;
  apiUrl: string;
};

/**
 * 辅助函数：创建测试用户并返回 token
 */
export async function createTestUser(
  request: APIRequestContext,
  userData?: { email?: string; password?: string; name?: string }
): Promise<AuthenticatedUser> {
  const timestamp = Date.now();
  const defaultUserData = {
    email: `testuser${timestamp}@example.com`,
    password: 'Test123456',
    name: `Test User ${timestamp}`,
  };

  const data = { ...defaultUserData, ...userData };

  // 注册
  const registerResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
    data,
  });

  if (registerResponse.status() !== 201) {
    throw new Error(`Failed to register user: ${await registerResponse.text()}`);
  }

  const registerBody = await registerResponse.json();

  // 登录
  const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: {
      email: data.email,
      password: data.password,
    },
  });

  if (loginResponse.status() !== 200) {
    throw new Error(`Failed to login user: ${await loginResponse.text()}`);
  }

  const loginBody = await loginResponse.json();

  return {
    id: registerBody.data.id,
    email: data.email,
    name: data.name,
    password: data.password,
    accessToken: loginBody.data.accessToken,
  };
}

/**
 * 辅助函数：创建管理员用户并返回 token
 */
export async function createAdminUser(
  request: APIRequestContext
): Promise<AuthenticatedUser> {
  const timestamp = Date.now();
  const adminData = {
    email: `testadmin${timestamp}@example.com`,
    password: 'Admin123456',
    name: `Test Admin ${timestamp}`,
    role: 'ADMIN',
    adminSecret: 'test-admin-secret',
  };

  // 注册管理员
  const registerResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
    data: adminData,
  });

  if (registerResponse.status() !== 201) {
    throw new Error(`Failed to register admin: ${await registerResponse.text()}`);
  }

  const registerBody = await registerResponse.json();

  // 登录
  const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: {
      email: adminData.email,
      password: adminData.password,
    },
  });

  if (loginResponse.status() !== 200) {
    throw new Error(`Failed to login admin: ${await loginResponse.text()}`);
  }

  const loginBody = await loginResponse.json();

  return {
    id: registerBody.data.id,
    email: adminData.email,
    name: adminData.name,
    password: adminData.password,
    accessToken: loginBody.data.accessToken,
  };
}

/**
 * API 测试基础扩展
 */
export const test = base.extend<ApiTestFixtures>({
  // API request context (built-in)
  api: async ({ request }, use) => {
    await use(request);
  },

  // API URL
  apiUrl: async ({}, use) => {
    await use(API_URL);
  },
});

// 导出 expect 以保持一致性
export { expect } from '@playwright/test';
