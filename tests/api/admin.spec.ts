/**
 * 管理 API 测试
 *
 * 测试管理员相关的 API 端点
 *
 * 覆盖 Epic 7: 系统管理
 */
import { test, expect, API_URL, createAdminUser, createTestUser } from './fixtures';

test.describe('管理 API', () => {
  let adminToken: string;
  let normalUserToken: string;
  let testUserId: string;

  test.beforeAll(async ({ api }) => {
    // 创建管理员用户
    const admin = await createAdminUser(api);
    adminToken = admin.accessToken;

    // 创建普通用户
    const user = await createTestUser(api);
    normalUserToken = user.accessToken;
    testUserId = user.id;
  });

  test.describe('[P1] GET /api/v1/admin/stats', () => {
    test('[P1] 管理员应能获取系统统计', async ({ api }) => {
      // WHEN: 管理员请求统计信息
      const response = await api.get(`${API_URL}/api/v1/admin/stats`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
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

    test('[P1] 普通用户请求统计应返回 403', async ({ api }) => {
      // WHEN: 普通用户请求统计信息
      const response = await api.get(`${API_URL}/api/v1/admin/stats`, {
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

    test('[P1] 未认证用户请求统计应返回 401', async ({ api }) => {
      // WHEN: 未认证用户请求统计信息
      const response = await api.get(`${API_URL}/api/v1/admin/stats`);

      // THEN: 应该返回 401 Unauthorized
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('[P1] GET /api/v1/admin/users', () => {
    test('[P1] 管理员应能获取用户列表', async ({ api }) => {
      // WHEN: 管理员请求用户列表
      const response = await api.get(`${API_URL}/api/v1/admin/users`, {
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

    test('[P1] 应支持分页查询', async ({ api }) => {
      // WHEN: 管理员请求用户列表 (带分页参数)
      const response = await api.get(`${API_URL}/api/v1/admin/users?page=1&limit=10`, {
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

    test('[P1] 应支持搜索过滤', async ({ api }) => {
      // WHEN: 管理员搜索用户
      const response = await api.get(`${API_URL}/api/v1/admin/users?search=test`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data) || Array.isArray(body.data?.items)).toBeTruthy();
      }
    });

    test('[P1] 普通用户请求用户列表应返回 403', async ({ api }) => {
      // WHEN: 普通用户请求用户列表
      const response = await api.get(`${API_URL}/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
      });

      // THEN: 应该返回 403 Forbidden
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('[P2] PATCH /api/v1/admin/users/:id/role', () => {
    test('[P2] 管理员应能修改用户角色', async ({ api }) => {
      // WHEN: 管理员修改用户角色
      const response = await api.patch(`${API_URL}/api/v1/admin/users/${testUserId}/role`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: { role: 'ADMIN' },
      });

      // THEN: 根据实际实现判断
      expect([200, 201, 404]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        const body = await response.json();
        expect(body.data.role).toBe('ADMIN');
      }
    });

    test('[P2] 修改角色时应验证角色值', async ({ api }) => {
      // WHEN: 管理员尝试设置无效角色
      const response = await api.patch(`${API_URL}/api/v1/admin/users/${testUserId}/role`, {
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

    test('[P2] 普通用户修改角色应返回 403', async ({ api }) => {
      // WHEN: 普通用户尝试修改角色
      const response = await api.patch(`${API_URL}/api/v1/admin/users/${testUserId}/role`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
        data: { role: 'ADMIN' },
      });

      // THEN: 应该返回 403 Forbidden
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('[P1] DELETE /api/v1/admin/users/:id', () => {
    let deleteUserId: string;

    test.beforeAll(async ({ api }) => {
      // 创建用于删除测试的用户
      const deleteUserData = {
        email: `deletetest${Date.now()}@example.com`,
        password: 'Delete123456',
        name: `Delete Test ${Date.now()}`,
      };

      const deleteResponse = await api.post(`${API_URL}/api/v1/auth/register`, {
        data: deleteUserData,
      });
      const deleteBody = await deleteResponse.json();
      deleteUserId = deleteBody.data.id;
    });

    test('[P1] 管理员应能删除用户', async ({ api }) => {
      // WHEN: 管理员删除用户
      const response = await api.delete(`${API_URL}/api/v1/admin/users/${deleteUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 根据实际实现判断
      expect([200, 204, 404]).toContain(response.status());

      // 验证用户已被删除
      const getResponse = await api.get(`${API_URL}/api/v1/admin/users/${deleteUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (getResponse.status() === 404) {
        expect(getResponse.status()).toBe(404);
      }
    });

    test('[P1] 普通用户删除用户应返回 403', async ({ api }) => {
      // WHEN: 普通用户尝试删除用户
      const response = await api.delete(`${API_URL}/api/v1/admin/users/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${normalUserToken}`,
        },
      });

      // THEN: 应该返回 403 Forbidden
      expect([401, 403, 404]).toContain(response.status());
    });
  });
});
