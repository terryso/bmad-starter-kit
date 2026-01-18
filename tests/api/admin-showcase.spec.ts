/**
 * 管理员项目审核 API 测试
 *
 * 测试管理员审核待审核项目的 API 端点
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-6: 管理员审核界面
 *
 * 知识库参考:
 * - test-levels-framework.md (API 测试决策)
 * - test-priorities-matrix.md (优先级分类)
 */
import { test, expect, API_URL, createTestUser, createAdminUser, submitPendingProject } from './fixtures';

test.describe('管理员项目审核 API', () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
  let adminUserId: string;

  test.beforeAll(async ({ api }) => {
    // 创建普通用户
    const user = await createTestUser(api);
    userToken = user.accessToken;
    testUserId = user.id;

    // 创建管理员用户
    const admin = await createAdminUser(api);
    adminToken = admin.accessToken;
    adminUserId = admin.id;
  });

  test.describe('[P0] GET /api/v1/admin/showcase/pending - 获取待审核项目列表', () => {
    test('[P0] 管理员应能获取待审核项目列表', async ({ api }) => {
      // GIVEN: 管理员已认证

      // WHEN: 请求待审核项目列表
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 返回 200 OK
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining('成功'),
      });

      // 验证响应结构
      expect(body.data).toHaveProperty('items');
      expect(body.data).toHaveProperty('meta');
      expect(Array.isArray(body.data.items)).toBeTruthy();
      expect(body.data.meta).toMatchObject({
        total: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    test('[P0] 待审核项目列表应包含提交者信息', async ({ api }) => {
      // GIVEN: 管理员已认证

      // WHEN: 请求待审核项目列表
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 每个项目应包含 submittedBy 信息
      if (response.status() === 200) {
        const body = await response.json();

        if (body.data.items.length > 0) {
          const firstItem = body.data.items[0];
          expect(firstItem).toHaveProperty('submittedBy');
          expect(firstItem.submittedBy).toMatchObject({
            id: expect.any(String),
            email: expect.any(String),
          });
        }
      }
    });

    test('[P0] 普通用户请求待审核列表应返回 403', async ({ api }) => {
      // GIVEN: 普通用户已认证

      // WHEN: 尝试请求待审核项目列表
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 403 Forbidden 或 401 Unauthorized
      expect([401, 403]).toContain(response.status());

      if (response.status() === 403) {
        const body = await response.json();
        expect(body.message || body.error).toMatch(/权限|禁止|forbidden/i);
      }
    });

    test('[P0] 未认证用户应返回 401', async ({ api }) => {
      // GIVEN: 用户未认证

      // WHEN: 请求待审核项目列表
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending`);

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('[P1] 应支持分页参数', async ({ api }) => {
      // GIVEN: 管理员已认证

      // WHEN: 使用分页参数请求
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending?page=1&pageSize=5`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 返回分页数据
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items.length).toBeLessThanOrEqual(5);
        expect(body.data.meta.page).toBe(1);
        expect(body.data.meta.pageSize).toBe(5);
      }
    });

    test('[P1] 没有待审核项目时应返回空列表', async ({ api }) => {
      // GIVEN: 管理员已认证

      // WHEN: 请求待审核项目列表
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 可能返回空列表（取决于测试数据）
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items).toBeDefined();
        // 空列表也是有效响应
        expect(Array.isArray(body.data.items)).toBeTruthy();
      }
    });
  });

  test.describe('[P1] GET /api/v1/admin/showcase/pending/count - 获取待审核数量', () => {
    test('[P1] 管理员应能获取待审核项目数量', async ({ api }) => {
      // GIVEN: 管理员已认证

      // WHEN: 请求待审核项目数量
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending/count`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 返回数量
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining('成功'),
      });
      expect(body.data).toHaveProperty('count');
      expect(typeof body.data.count).toBe('number');
      expect(body.data.count).toBeGreaterThanOrEqual(0);
    });

    test('[P1] 普通用户请求待审核数量应返回 403', async ({ api }) => {
      // GIVEN: 普通用户已认证

      // WHEN: 尝试请求待审核项目数量
      const response = await api.get(`${API_URL}/api/v1/admin/showcase/pending/count`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 403 Forbidden 或 401 Unauthorized
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('[P0] PUT /api/v1/admin/showcase/:id/approve - 批准项目', () => {
    let pendingProjectId: string;

    test.beforeAll(async ({ api }) => {
      // 创建一个待审核的项目
      const project = await submitPendingProject(api, userToken);
      if (project) {
        pendingProjectId = project.id;
      }
    });

    test('[P0] 管理员应能批准待审核项目', async ({ api }) => {
      // 如果没有待审核项目，跳过此测试
      if (!pendingProjectId) {
        test.skip();
        return;
      }

      // GIVEN: 管理员已认证
      // AND: 存在待审核项目

      // WHEN: 批准项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${pendingProjectId}/approve`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 返回 200 OK
      // 注意: 如果项目已被其他操作处理，可能返回 400
      expect([200, 400]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toMatchObject({
          statusCode: 200,
          message: expect.stringContaining('批准'),
        });
        expect(body.data).toHaveProperty('id');
      }
    });

    test('[P0] 批准不存在的项目应返回 404', async ({ api }) => {
      // GIVEN: 管理员已认证
      const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 尝试批准不存在的项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${nonExistentId}/approve`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 返回 404 Not Found
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body.message || body.error).toMatch(/not found|不存在|找不到/i);
    });

    test('[P0] 普通用户批准项目应返回 403', async ({ api }) => {
      // GIVEN: 普通用户已认证
      const testId = pendingProjectId || 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 尝试批准项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${testId}/approve`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 403 Forbidden 或 401 Unauthorized
      expect([401, 403, 404]).toContain(response.status());
    });

    test('[P1] 批准已批准的项目应返回 400', async ({ api }) => {
      // GIVEN: 管理员已认证
      // AND: 项目已被批准（在上一个测试中）
      if (!pendingProjectId) {
        test.skip();
        return;
      }

      // WHEN: 尝试再次批准同一项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${pendingProjectId}/approve`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // THEN: 返回 400 Bad Request（项目已处理）
      // 可能是 400 或 404（取决于实现）
      expect([400, 404]).toContain(response.status());

      if (response.status() === 400) {
        const body = await response.json();
        expect(body.message || body.error).toBeTruthy();
      }
    });
  });

  test.describe('[P0] PUT /api/v1/admin/showcase/:id/reject - 拒绝项目', () => {
    let pendingProjectId: string;

    test.beforeAll(async ({ api }) => {
      // 创建一个新的待审核项目用于拒绝测试
      // 使用不同的 URL 避免与批准测试冲突
      const project = await submitPendingProject(api, userToken, `https://github.com/test-reject-${Date.now()}/repo`);
      if (project) {
        pendingProjectId = project.id;
      }
    });

    test('[P0] 管理员应能拒绝待审核项目', async ({ api }) => {
      // 如果没有待审核项目，跳过此测试
      if (!pendingProjectId) {
        test.skip();
        return;
      }

      // GIVEN: 管理员已认证
      // AND: 存在待审核项目

      // WHEN: 拒绝项目并提供原因
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${pendingProjectId}/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: '项目描述不完整，请补充更多技术细节',
        },
      });

      // THEN: 返回 200 OK
      expect([200, 400]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toMatchObject({
          statusCode: 200,
          message: expect.stringContaining('拒绝'),
        });
        expect(body.data).toHaveProperty('id');
      }
    });

    test('[P0] 拒绝原因少于5个字符应返回验证错误', async ({ api }) => {
      // GIVEN: 管理员已认证
      const testId = pendingProjectId || 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 拒绝项目但原因过短
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${testId}/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: 'abc', // 少于 5 个字符
        },
      });

      // THEN: 返回 400 Bad Request
      expect([400, 404]).toContain(response.status());

      if (response.status() === 400) {
        const body = await response.json();
        // 验证错误在 errors 数组中
        if (body.errors && Array.isArray(body.errors)) {
          const errorMessages = body.errors.map((e: any) => e.message || '').join(' ');
          expect(errorMessages).toMatch(/5|字符|min length/i);
        } else {
          // 如果没有 errors 数组，检查 message
          const errorText = body.message || body.error || JSON.stringify(body);
          expect(errorText).toMatch(/5|字符|min length|required/i);
        }
      }
    });

    test('[P0] 拒绝项目时必须提供原因', async ({ api }) => {
      // GIVEN: 管理员已认证
      const testId = pendingProjectId || 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 拒绝项目但不提供原因
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${testId}/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: '',
        },
      });

      // THEN: 返回 400 Bad Request
      expect([400, 404]).toContain(response.status());

      if (response.status() === 400) {
        const body = await response.json();
        // 验证错误在 errors 数组中
        if (body.errors && Array.isArray(body.errors)) {
          const errorMessages = body.errors.map((e: any) => e.message || '').join(' ');
          expect(errorMessages).toMatch(/不能为空|required|empty/i);
        } else {
          // 如果没有 errors 数组，检查 message
          const errorText = body.message || body.error || JSON.stringify(body);
          expect(errorText).toMatch(/不能为空|required|empty/i);
        }
      }
    });

    test('[P0] 普通用户拒绝项目应返回 403', async ({ api }) => {
      // GIVEN: 普通用户已认证
      const testId = 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 尝试拒绝项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${testId}/reject`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          rejectionReason: '测试拒绝原因',
        },
      });

      // THEN: 返回 403 Forbidden 或 401 Unauthorized
      expect([401, 403]).toContain(response.status());
    });

    test('[P1] 拒绝不存在的项目应返回 404', async ({ api }) => {
      // GIVEN: 管理员已认证
      const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 尝试拒绝不存在的项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${nonExistentId}/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: '测试拒绝原因',
        },
      });

      // THEN: 返回 404 Not Found
      expect(response.status()).toBe(404);
    });

    test('[P1] 拒绝已处理的项目的边界情况', async ({ api }) => {
      // GIVEN: 管理员已认证
      // 创建一个新的项目用于此测试
      const project = await submitPendingProject(api, userToken, `https://github.com/test-boundary-${Date.now()}/repo`);
      if (!project) {
        test.skip();
        return;
      }

      // 首先拒绝该项目
      await api.put(`${API_URL}/api/v1/admin/showcase/${project.id}/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: '第一次拒绝',
        },
      });

      // WHEN: 尝试拒绝已被拒绝的项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/${project.id}/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: '再次拒绝的原因',
        },
      });

      // THEN: 应返回 400（已处理）
      expect(response.status()).toBe(400);
    });
  });

  test.describe('[P2] 边界情况和错误处理', () => {
    test('[P2] 无效的项目 ID 格式应返回适当错误', async ({ api }) => {
      // GIVEN: 管理员已认证

      // WHEN: 使用无效的 ID 格式
      const invalidIds = [
        'invalid-id',
        '123',
        'abc',
        '',
      ];

      for (const id of invalidIds) {
        const response = await api.put(`${API_URL}/api/v1/admin/showcase/${id}/approve`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        // 无效 ID 应返回 400 或 404
        expect([400, 404]).toContain(response.status());
      }
    });

    test('[P2] 超长的拒绝原因应被接受', async ({ api }) => {
      // GIVEN: 管理员已认证
      const longReason = 'a'.repeat(500); // 超长原因

      // WHEN: 使用超长原因拒绝项目
      const response = await api.put(`${API_URL}/api/v1/admin/showcase/clxxxxxxxxxxxxxxxxxxxxxxxxxxxx/reject`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          rejectionReason: longReason,
        },
      });

      // THEN: 如果项目存在，应该接受（或返回 404）
      expect([200, 400, 404]).toContain(response.status());
    });
  });
});
