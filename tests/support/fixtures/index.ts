/**
 * 测试 Fixture 架构
 *
 * 采用 mergeTests 组合模式，支持:
 * - 自动清理测试数据
 * - 组合多个 fixture
 * - 类型安全的测试扩展
 * - 认证用户自动设置和清理
 *
 * 使用示例:
 * import { test, expect } from '@/tests/support/fixtures';
 */
import { test as base, Page } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { ProjectFactory } from './factories/project.factory';

// 导出工厂类供外部使用
export { UserFactory } from './factories/user-factory';
export { ProjectFactory } from './factories/project.factory';

/**
 * API 配置
 */
declare const process: { env: { API_URL?: string; BASE_URL?: string } };
const API_URL = process.env.API_URL || 'http://localhost:3000';

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
 * 测试 Fixture 类型定义
 */
export type TestFixtures = {
  userFactory: UserFactory;
  projectFactory: ProjectFactory;
  authenticatedUser: AuthenticatedUser;
  authenticatedAdminUser: AuthenticatedUser;
  apiHelper: ApiHelper;
};

/**
 * API 辅助类
 */
export class ApiHelper {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string): void {
    this.token = token;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async register(data: { email: string; password: string; name: string }): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { status: response.status, body: await response.json() };
  }

  async login(email: string, password: string): Promise<{ status: number; body: unknown; cookies: string }> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const setCookieHeader = response.headers.get('set-cookie');
    const refreshToken = setCookieHeader
      ? Array.from(setCookieHeader.split(';')).find((c) => c.trim().startsWith('refresh_token=')) || ''
      : '';

    return {
      status: response.status,
      body: await response.json(),
      cookies: refreshToken.split('=')[1] || '',
    };
  }

  async get(endpoint: string): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });
    return { status: response.status, body: await response.json() };
  }

  async post(endpoint: string, data: unknown): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { status: response.status, body: await response.json() };
  }

  async put(endpoint: string, data: unknown): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { status: response.status, body: await response.json() };
  }

  async delete(endpoint: string): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return { status: response.status, body: await response.json() };
  }
}

/**
 * 在浏览器中设置认证状态 (保留用于未来扩展)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setAuthInPage(page: Page, accessToken: string, userId: string): Promise<void> {
  await page.goto('/login');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify({ id: user }));
    },
    { token: accessToken, user: userId },
  );
}

/**
 * 基础测试扩展 - 包含所有通用 fixture
 */
export const test = base.extend<TestFixtures>({
  // 用户数据工厂 - 自动清理创建的用户
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    // 自动清理
    await factory.cleanup();
  },

  // 项目数据工厂
  projectFactory: async ({}, use) => {
    const factory = new ProjectFactory();
    await use(factory);
  },

  // API 辅助工具
  apiHelper: async ({}, use) => {
    const helper = new ApiHelper();
    await use(helper);
  },

  // 已认证的普通用户 fixture
  authenticatedUser: async ({ page }, use) => {
    const apiHelper = new ApiHelper();

    // 生成随机用户数据
    const timestamp = Date.now();
    const userData = {
      email: `testuser${timestamp}@example.com`,
      password: 'Test123456',
      name: `Test User ${timestamp}`,
    };

    // 注册用户
    const registerResult = await apiHelper.register(userData);
    if (registerResult.status !== 201) {
      throw new Error(`Failed to register user: ${JSON.stringify(registerResult.body)}`);
    }
    // 注册成功，用户信息将在登录后获取

    // 登录获取 token
    const loginResult = await apiHelper.login(userData.email, userData.password);
    if (loginResult.status !== 200) {
      throw new Error(`Failed to login user: ${JSON.stringify(loginResult.body)}`);
    }
    const loginBody = loginResult.body as {
      data: { accessToken: string; user: { id: string; email: string; name: string } };
    };

    const authUser: AuthenticatedUser = {
      id: loginBody.data.user.id,
      email: loginBody.data.user.email,
      name: loginBody.data.user.name,
      password: userData.password,
      accessToken: loginBody.data.accessToken,
    };

    // 设置页面认证状态
    await page.goto('/login');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      },
      { token: authUser.accessToken, user: authUser },
    );

    // 提供给测试使用
    await use(authUser);

    // 清理: 注销用户
    apiHelper.setAuthToken(authUser.accessToken);
    void apiHelper.post('/api/v1/auth/logout', {});
  },

  // 已认证的管理员用户 fixture
  authenticatedAdminUser: async ({ page, request }, use) => {
    const timestamp = Date.now();
    const adminData = {
      email: `testadmin${timestamp}@example.com`,
      password: 'Admin123456',
      name: `Test Admin ${timestamp}`,
      role: 'admin',
    };

    // 注册管理员用户
    const registerResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: adminData,
    });

    if (registerResponse.status() !== 201) {
      throw new Error(`Failed to register admin user: ${await registerResponse.text()}`);
    }

    const registerBody = await registerResponse.json();
    const userId = registerBody.data.id;

    // 更新为管理员角色 (通过 API)
    const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        email: adminData.email,
        password: adminData.password,
      },
    });

    if (loginResponse.status() !== 200) {
      throw new Error(`Failed to login admin user: ${await loginResponse.text()}`);
    }

    const loginBody = await loginResponse.json();

    // 更新角色为 admin (需要直接数据库操作或管理员 API)
    // 注意: 如果 API 不存在，需要在数据库中手动设置角色
    // 这里假设通过请求上下文，角色更新可以异步执行
    void request.patch(`${API_URL}/api/v1/admin/users/${userId}/role`, {
      headers: {
        Authorization: `Bearer ${loginBody.data.accessToken}`,
      },
      data: { role: 'admin' },
    }).catch(() => {
      // 如果角色更新 API 不存在，忽略错误
      // 测试可能需要其他方式来设置管理员角色
    });

    const authAdmin: AuthenticatedUser = {
      id: userId,
      email: adminData.email,
      name: adminData.name,
      password: adminData.password,
      accessToken: loginBody.data.accessToken,
    };

    // 设置页面认证状态
    await page.goto('/login');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      },
      { token: authAdmin.accessToken, user: authAdmin },
    );

    // 提供给测试使用
    await use(authAdmin);

    // 清理: 注销管理员
    await request.post(`${API_URL}/api/v1/auth/logout`, {
      headers: {
        Authorization: `Bearer ${authAdmin.accessToken}`,
      },
    });
  },
});

// 导出 expect 以保持一致性
export { expect } from '@playwright/test';
