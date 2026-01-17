/**
 * 认证 API 测试
 *
 * 测试认证相关的 API 端点
 * 使用 Playwright 的 request context 进行 API 测试
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('认证 API', () => {
  let testUser: { email: string; password: string; name: string; id?: string };

  test.beforeEach(async () => {
    // 生成随机测试用户数据
    const timestamp = Date.now();
    testUser = {
      email: `test${timestamp}@example.com`,
      password: 'Test123456',
      name: `Test User ${timestamp}`,
    };
  });

  test.describe('[P0] POST /api/v1/auth/register', () => {
    test('[P0] 应该成功注册新用户', async ({ request }) => {
      // WHEN: 发送注册请求
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      // THEN: 返回 201 Created
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 201,
        message: '注册成功',
      });
      expect(body.data).toMatchObject({
        email: testUser.email,
        name: testUser.name,
      });
      expect(body.data).not.toHaveProperty('password');
      expect(body.data).toHaveProperty('id');

      // 保存用户 ID 用于清理
      testUser.id = body.data.id;
    });

    test('[P1] 重复邮箱应返回 409 Conflict', async ({ request }) => {
      // GIVEN: 先注册一个用户
      await request.post(`${API_URL}/api/v1/auth/register`, {
        data: testUser,
      });

      // WHEN: 使用相同邮箱再次注册
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: testUser,
      });

      // THEN: 返回 409 Conflict
      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.message).toMatch(/已存在|已被注册/);
    });

    test('[P1] 无效邮箱格式应返回 400 Bad Request', async ({ request }) => {
      // WHEN: 发送无效邮箱的注册请求
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: {
          email: 'not-an-email',
          password: testUser.password,
          name: testUser.name,
        },
      });

      // THEN: 返回 400 Bad Request
      expect(response.status()).toBe(400);
    });

    test('[P1] 密码过短应返回 400 Bad Request', async ({ request }) => {
      // WHEN: 发送密码过短的注册请求
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: {
          email: testUser.email,
          password: '123',
          name: testUser.name,
        },
      });

      // THEN: 返回 400 Bad Request
      expect(response.status()).toBe(400);
    });
  });

  test.describe('[P0] POST /api/v1/auth/login', () => {
    let registeredUser: { id: string; email: string; name: string };

    test.beforeEach(async ({ request }) => {
      // 注册测试用户
      const response = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: testUser,
      });
      const body = await response.json();
      registeredUser = body.data;
    });

    test('[P0] 应该成功登录有效用户', async ({ request }) => {
      // WHEN: 使用正确凭证登录
      const response = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      // THEN: 返回 200 OK 和 access token
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 200,
        message: '登录成功',
      });
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('user');
      expect(body.data.user).toMatchObject({
        id: registeredUser.id,
        email: registeredUser.email,
        name: registeredUser.name,
      });

      // JWT token 格式验证
      expect(body.data.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    test('[P1] 错误密码应返回 401 Unauthorized', async ({ request }) => {
      // WHEN: 使用错误密码登录
      const response = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
          password: 'WrongPassword123',
        },
      });

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('[P1] 不存在的用户应返回 401 Unauthorized', async ({ request }) => {
      // WHEN: 使用不存在的用户登录
      const response = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: testUser.password,
        },
      });

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('[P1] 缺少字段应返回 400 Bad Request', async ({ request }) => {
      // WHEN: 缺少密码字段
      const response = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
        },
      });

      // THEN: 返回 400 Bad Request
      expect(response.status()).toBe(400);
    });
  });

  test.describe('[P1] POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    test.beforeEach(async ({ request }) => {
      // 注册并登录用户
      await request.post(`${API_URL}/api/v1/auth/register`, {
        data: testUser,
      });

      const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      // 获取 refresh token cookie
      const cookies = loginResponse.headers()['set-cookie'];
      const cookiesArray = Array.isArray(cookies) ? cookies : cookies?.split(',') || [];
      const refreshCookie = cookiesArray.find((c: string) => c.includes('refresh_token='));
      refreshToken = refreshCookie?.split(';')[0].split('=')[1] || '';
    });

    test('[P1] 应该使用 refresh token 获取新的 access token', async ({ request }) => {
      // WHEN: 使用 refresh token 刷新
      const response = await request.post(`${API_URL}/api/v1/auth/refresh`, {
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
      });

      // THEN: 返回新的 access token
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    test('[P1] 无效的 refresh token 应返回 401', async ({ request }) => {
      // WHEN: 使用无效的 refresh token
      const response = await request.post(`${API_URL}/api/v1/auth/refresh`, {
        headers: {
          Cookie: 'refresh_token=invalid_token',
        },
      });

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);
    });
  });

  test.describe('[P1] POST /api/v1/auth/logout', () => {
    let accessToken: string;

    test.beforeEach(async ({ request }) => {
      // 注册并登录用户
      await request.post(`${API_URL}/api/v1/auth/register`, {
        data: testUser,
      });

      const loginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const body = await loginResponse.json();
      accessToken = body.data.accessToken;
    });

    test('[P1] 应该成功登出已登录用户', async ({ request }) => {
      // WHEN: 登出
      const response = await request.post(`${API_URL}/api/v1/auth/logout`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // THEN: 返回 200 OK
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.message).toBe('登出成功');
    });

    test('[P1] 未登录用户登出应返回 401', async ({ request }) => {
      // WHEN: 未登录时尝试登出
      const response = await request.post(`${API_URL}/api/v1/auth/logout`);

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);
    });
  });
});
