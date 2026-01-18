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
  // 使用随机数避免并发测试时的邮箱冲突
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  const defaultUserData = {
    email: `testuser${timestamp}${randomSuffix}@example.com`,
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
 * 如果创建失败（如已存在），尝试使用固定的管理员账户
 */
export async function createAdminUser(
  request: APIRequestContext
): Promise<AuthenticatedUser> {
  // 使用随机数避免并发测试时的邮箱冲突
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  const adminData = {
    email: `testadmin${timestamp}${randomSuffix}@example.com`,
    password: 'Admin123456',
    name: `Test Admin ${timestamp}`,
    role: 'ADMIN',
    adminSecret: 'test-admin-secret',
  };

  // 注册管理员
  const registerResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
    data: adminData,
  });

  // 如果注册失败（如并发冲突、速率限制等），尝试使用固定管理员账户登录
  if (registerResponse.status() !== 201) {
    // 尝试登录已存在的管理员账户（使用固定的测试管理员）
    const fallbackAdmin = {
      email: 'admin@test.com',
      password: 'Admin123456',
    };

    // 先尝试注册固定管理员（忽略结果，可能已存在）
    await request.post(`${API_URL}/api/v1/auth/register`, {
      data: {
        email: fallbackAdmin.email,
        password: fallbackAdmin.password,
        name: 'Test Admin',
        role: 'ADMIN',
        adminSecret: 'test-admin-secret',
      },
    });

    // 然后尝试登录
    const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: fallbackAdmin,
    });

    if (loginResponse.status() !== 200) {
      throw new Error(`Failed to login admin: ${await loginResponse.text()}`);
    }

    const loginBody = await loginResponse.json();
    return {
      id: loginBody.data.user.id,
      email: fallbackAdmin.email,
      name: loginBody.data.user.name,
      password: fallbackAdmin.password,
      accessToken: loginBody.data.accessToken,
    };
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
 * 辅助函数：提交项目并返回项目 ID
 * 用于创建待审核的测试项目
 */
export async function submitPendingProject(
  request: APIRequestContext,
  userToken: string,
  githubUrl?: string
): Promise<{ id: string; status: string } | null> {
  // 使用默认的测试 URL 或自定义 URL
  const url = githubUrl || `https://github.com/test-project-${Date.now()}/repo`;

  const submitResponse = await request.post(`${API_URL}/api/v1/showcase/submit`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
    data: { githubUrl: url },
  });

  // 201 = 新创建, 409 = 已存在（都可以使用）
  if (submitResponse.status() === 201) {
    const body = await submitResponse.json();
    return { id: body.data.id, status: body.data.status };
  } else if (submitResponse.status() === 409) {
    // 项目已存在，尝试获取现有的 PENDING 项目
    const listResponse = await request.get(`${API_URL}/api/v1/showcase`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (listResponse.status() === 200) {
      const listBody = await listResponse.json();
      const pendingProject = listBody.data.items?.find((p: any) => p.status === 'PENDING');
      if (pendingProject) {
        return { id: pendingProject.id, status: pendingProject.status };
      }
    }
  }

  return null;
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
