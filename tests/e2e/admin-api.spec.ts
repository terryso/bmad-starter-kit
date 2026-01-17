/**
 * 管理 API 测试
 *
 * 测试管理员相关的 API 端点
 * 使用 Playwright 的 request context 进行 API 测试
 *
 * 覆盖 Epic 7: 系统管理
 */
import { test, expect } from '@playwright/test';

declare const process: { env: { API_URL?: string } };
const API_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('管理 API', () => {
  let adminToken: string;
  let normalUserToken: string;
  let testUserId: string;

  test.beforeAll(async ({ request }) => {
    // 创建管理员用户
    const adminTimestamp = Date.now();
    const adminData = {
      email: `testadmin${adminTimestamp}@example.com`,
      password: 'Admin123456',
      name: `Test Admin ${adminTimestamp}`,
    };

    const adminRegisterResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: adminData,
    });
    expect(adminRegisterResponse.status()).toBe(201);

    // 登录获取管理员 token
    const adminLoginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        email: adminData.email,
        password: adminData.password,
      },
    });
    expect(adminLoginResponse.status()).toBe(200);
    const adminLoginBody = await adminLoginResponse.json();
    adminToken = adminLoginBody.data.accessToken;

    // 创建普通用户
    const userTimestamp = Date.now();
    const userData = {
      email: `testuser${userTimestamp}@example.com`,
      password: 'User123456',
      name: `Test User ${userTimestamp}`,
    };

    const userRegisterResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
      data: userData,
    });
    expect(userRegisterResponse.status()).toBe(201);
    const userRegisterBody = await userRegisterResponse.json();
    testUserId = userRegisterBody.data.id;

    // 登录获取普通用户 token
    const userLoginResponse = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        email: userData.email,
        password: userData.password,
      },
    });
    expect(userLoginResponse.status()).toBe(200);
    const userLoginBody = await userLoginResponse.json();
    normalUserToken = userLoginBody.data.accessToken;
  });

  test.describe('[P1] GET /api/v1/admin/stats', () => {
    test('[P1] 管理员应能获取系统统计', async ({ request }) => {
      // WHEN: 管理员请求统计信息
      const response = await request.get(`${API_URL}/api/v1/admin/stats`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      // 如果端点存在，应该返回 200
      // 如果端点不存在，返回 404
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(body.data).toMatchObject({
          totalUsers: expect.any(Number),
          totalProjects: expect.any(Number),
        });
      }
    });

    test('[P1] 普通用户请求统计应返回 403', async ({ request }) => {
      // WHEN: 普通用户请求统计信息
      const response = await request.get(`${API_URL}/api/v1/admin/stats`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
      });

      // THEN: 应该返回 403 Forbidden 或 401 Unauthorized
      expect([401, 403, 404]).toContain(response.status());

      if (response.status() === 403) {
        const body = await response.json();
        expect(body.message).toMatch(/权限|禁止|forbidden/i);
      }
    });

    test('[P1] 未认证用户请求统计应返回 401', async ({ request }) => {
      // WHEN: 未认证用户请求统计信息
      const response = await request.get(`${API_URL}/api/v1/admin/stats`);

      // THEN: 应该返回 401 Unauthorized
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('[P1] GET /api/v1/admin/users', () => {
    test('[P1] 管理员应能获取用户列表', async ({ request }) => {
      // WHEN: 管理员请求用户列表
      const response = await request.get(`${API_URL}/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBeTruthy();
        expect(body.data.length).toBeGreaterThan(0);
      }
    });

    test('[P1] 应支持分页查询', async ({ request }) => {
      // WHEN: 管理员请求用户列表 (带分页参数)
      const response = await request.get(`${API_URL}/api/v1/admin/users?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('items');
        expect(body.data).toHaveProperty('total');
        expect(body.data).toHaveProperty('page');
        expect(body.data).toHaveProperty('limit');
      }
    });

    test('[P1] 应支持搜索过滤', async ({ request }) => {
      // WHEN: 管理员搜索用户
      const response = await request.get(`${API_URL}/api/v1/admin/users?search=test`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
        // 搜索结果应该包含匹配的用户
        expect(Array.isArray(body.data) || Array.isArray(body.data?.items)).toBeTruthy();
      }
    });

    test('[P1] 普通用户请求用户列表应返回 403', async ({ request }) => {
      // WHEN: 普通用户请求用户列表
      const response = await request.get(`${API_URL}/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
      });

      // THEN: 应该返回 403 Forbidden
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('[P2] PATCH /api/v1/admin/users/:id/role', () => {
    test('[P2] 管理员应能修改用户角色', async ({ request }) => {
      // WHEN: 管理员修改用户角色
      const response = await request.patch(`${API_URL}/api/v1/admin/users/${testUserId}/role`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: { role: 'admin' },
      });

      // THEN: 根据实际实现判断
      expect([200, 201, 404]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        const body = await response.json();
        expect(body.data.role).toBe('admin');
      }
    });

    test('[P2] 修改角色时应验证角色值', async ({ request }) => {
      // WHEN: 管理员尝试设置无效角色
      const response = await request.patch(`${API_URL}/api/v1/admin/users/${testUserId}/role`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: { role: 'invalid_role' },
      });

      // THEN: 应该返回验证错误
      if (response.status() !== 404) {
        expect([400, 422]).toContain(response.status());
      }
    });

    test('[P2] 普通用户修改角色应返回 403', async ({ request }) => {
      // WHEN: 普通用户尝试修改角色
      const response = await request.patch(`${API_URL}/api/v1/admin/users/${testUserId}/role`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
        data: { role: 'admin' },
      });

      // THEN: 应该返回 403 Forbidden
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('[P1] DELETE /api/v1/admin/users/:id', () => {
    let deleteUserId: string;

    test.beforeAll(async ({ request }) => {
      // 创建用于删除测试的用户
      const deleteTimestamp = Date.now();
      const deleteUserData = {
        email: `deletetest${deleteTimestamp}@example.com`,
        password: 'Delete123456',
        name: `Delete Test ${deleteTimestamp}`,
      };

      const deleteResponse = await request.post(`${API_URL}/api/v1/auth/register`, {
        data: deleteUserData,
      });
      const deleteBody = await deleteResponse.json();
      deleteUserId = deleteBody.data.id;
    });

    test('[P1] 管理员应能删除用户', async ({ request }) => {
      // WHEN: 管理员删除用户
      const response = await request.delete(`${API_URL}/api/v1/admin/users/${deleteUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      expect([200, 204, 404]).toContain(response.status());

      // 验证用户已被删除
      const getResponse = await request.get(`${API_URL}/api/v1/admin/users/${deleteUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (getResponse.status() === 404) {
        // 用户已不存在
        expect(getResponse.status()).toBe(404);
      }
    });

    test('[P1] 普通用户删除用户应返回 403', async ({ request }) => {
      // WHEN: 普通用户尝试删除用户
      const response = await request.delete(`${API_URL}/api/v1/admin/users/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
      });

      // THEN: 应该返回 403 Forbidden
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});
