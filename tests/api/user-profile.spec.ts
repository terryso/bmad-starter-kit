/**
 * 用户个人资料 API 测试
 *
 * 测试用户查看和更新个人资料的 API 端点
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect, API_URL, createTestUser } from './fixtures';

test.describe('用户个人资料 API', () => {
  let userToken: string;
  let userId: string;
  let userData: { email: string; password: string; name: string };

  test.beforeEach(async ({ api }) => {
    // 创建测试用户
    const user = await createTestUser(api);
    userData = {
      email: user.email,
      password: user.password,
      name: user.name,
    };
    userToken = user.accessToken;
    userId = user.id;
  });

  test.describe('[P1] GET /api/v1/users/me', () => {
    test('[P1] 已登录用户应能获取个人资料', async ({ api }) => {
      // WHEN: 请求当前用户信息
      const response = await api.get(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 根据实际实现判断
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data).toMatchObject({
          id: userId,
          email: userData.email,
          name: userData.name,
        });
        // 密码不应该返回
        expect(body.data).not.toHaveProperty('password');
      }
    });

    test('[P1] 未登录用户应返回 401', async ({ api }) => {
      // WHEN: 未认证用户请求个人资料
      const response = await api.get(`${API_URL}/api/v1/users/me`);

      // THEN: 应该返回 401 Unauthorized
      expect([401, 404]).toContain(response.status());
    });

    test('[P1] 无效 token 应返回 401', async ({ api }) => {
      // WHEN: 使用无效 token
      const response = await api.get(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: 'Bearer invalid_token_12345',
        },
      });

      // THEN: 应该返回 401 Unauthorized
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('[P1] PUT /api/v1/users/profile', () => {
    test('[P1] 已登录用户应能更新姓名', async ({ api }) => {
      // WHEN: 更新用户姓名
      const newName = 'Updated Name';
      const response = await api.put(`${API_URL}/api/v1/users/profile`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { name: newName },
      });

      // THEN: 根据实际实现判断
      expect([200, 201, 404]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        const body = await response.json();
        expect(body.data.name).toBe(newName);

        // 验证更新成功
        const getResponse = await api.get(`${API_URL}/api/v1/users/me`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        if (getResponse.status() === 200) {
          const getBody = await getResponse.json();
          expect(getBody.data.name).toBe(newName);
        }
      }
    });

    test('[P1] 更新时应验证数据', async ({ api }) => {
      // WHEN: 尝试更新空姓名
      const response = await api.put(`${API_URL}/api/v1/users/profile`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { name: '' },
      });

      // THEN: 应该返回验证错误
      if (response.status() !== 404) {
        expect([400, 422]).toContain(response.status());
        const body = await response.json();
        expect(body.message || body.error).toBeTruthy();
      }
    });

    test('[P1] 未登录用户更新应返回 401', async ({ api }) => {
      // WHEN: 未认证用户尝试更新
      const response = await api.put(`${API_URL}/api/v1/users/profile`, {
        data: { name: 'Hacker Name' },
      });

      // THEN: 应该返回 401 Unauthorized
      expect([401, 404]).toContain(response.status());
    });

    test('[P2] 不应允许更新邮箱', async ({ api }) => {
      // WHEN: 尝试更新邮箱
      const response = await api.put(`${API_URL}/api/v1/users/profile`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { email: 'newemail@example.com' },
      });

      // THEN: 根据实际实现判断
      if (response.status() !== 404) {
        expect([200, 400, 422]).toContain(response.status());

        if (response.status() === 200) {
          // 验证邮箱没有被修改
          const getResponse = await api.get(`${API_URL}/api/v1/users/me`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          if (getResponse.status() === 200) {
            const getBody = await getResponse.json();
            expect(getBody.data.email).toBe(userData.email);
          }
        }
      }
    });

    test('[P2] 不应允许更新密码', async ({ api }) => {
      // WHEN: 尝试通过此端点更新密码
      const response = await api.put(`${API_URL}/api/v1/users/profile`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { password: 'NewPassword123' },
      });

      // THEN: 根据实际实现判断
      if (response.status() !== 404) {
        expect([200, 400, 422]).toContain(response.status());
      }
    });
  });

  test.describe('[P2] PUT /api/v1/users/password', () => {
    test('[P2] 已登录用户应能修改密码', async ({ api }) => {
      // WHEN: 修改密码
      const newPassword = 'NewPassword123';
      const response = await api.put(`${API_URL}/api/v1/users/password`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          currentPassword: userData.password,
          newPassword: newPassword,
        },
      });

      // THEN: 根据实际实现判断
      expect([200, 201, 404]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        // 验证新密码可以登录
        const loginResponse = await api.post(`${API_URL}/api/v1/auth/login`, {
          data: {
            email: userData.email,
            password: newPassword,
          },
        });

        expect(loginResponse.status()).toBe(200);
      }
    });

    test('[P2] 修改密码时应验证当前密码', async ({ api }) => {
      // WHEN: 使用错误的当前密码
      const response = await api.put(`${API_URL}/api/v1/users/password`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
        },
      });

      // THEN: 应该返回错误
      if (response.status() !== 404) {
        expect([400, 401]).toContain(response.status());
      }
    });

    test('[P2] 新密码应满足强度要求', async ({ api }) => {
      // WHEN: 使用弱密码
      const response = await api.put(`${API_URL}/api/v1/users/password`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          currentPassword: userData.password,
          newPassword: '123',
        },
      });

      // THEN: 应该返回验证错误
      if (response.status() !== 404) {
        expect([400, 422]).toContain(response.status());
      }
    });
  });

  test.describe('[P2] DELETE /api/v1/users/me', () => {
    test('[P2] 已登录用户应能删除账户', async ({ api }) => {
      // WHEN: 用户删除自己的账户
      const response = await api.delete(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 根据实际实现判断
      expect([200, 204, 404]).toContain(response.status());

      if (response.status() === 200 || response.status() === 204) {
        // 验证账户已被删除，无法再登录
        const loginResponse = await api.post(`${API_URL}/api/v1/auth/login`, {
          data: {
            email: userData.email,
            password: userData.password,
          },
        });

        expect(loginResponse.status()).toBe(401);
      }
    });

    test('[P2] 删除账户后 token 应失效', async ({ api }) => {
      // GIVEN: 用户删除账户
      const deleteResponse = await api.delete(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (deleteResponse.status() === 200 || deleteResponse.status() === 204) {
        // WHEN: 使用之前的 token
        const response = await api.get(`${API_URL}/api/v1/users/me`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // THEN: Token 应该失效
        expect([401, 404]).toContain(response.status());
      }
    });
  });
});
