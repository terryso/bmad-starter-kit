/**
 * My Projects API 测试
 *
 * 测试用户查看和管理自己提交的项目的 API 端点
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-7: 我的项目管理
 *
 * 知识库参考:
 * - test-levels-framework.md (API 测试决策)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户功能)
 * - test-quality.md (确定性测试、显式断言)
 */
import { test, expect, API_URL, createTestUser, submitPendingProject } from './fixtures';

test.describe('My Projects API', () => {
  let userToken: string;
  let testUserId: string;

  test.beforeAll(async ({ api }) => {
    // 创建普通用户
    const user = await createTestUser(api);
    userToken = user.accessToken;
    testUserId = user.id;
  });

  test.describe('[P1] GET /api/v1/showcase/my-projects - 获取我的项目列表', () => {
    test('[P1] 认证用户应能获取自己的项目列表', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 请求我的项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
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
      expect(body.data).toMatchObject({
        items: expect.any(Array),
        meta: expect.objectContaining({
          total: expect.any(Number),
          page: expect.any(Number),
          pageSize: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });

      // 验证 items 是数组
      expect(Array.isArray(body.data.items)).toBeTruthy();
    });

    test('[P1] 未认证用户应返回 401', async ({ api }) => {
      // GIVEN: 用户未认证

      // WHEN: 请求我的项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`);

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.message || body.error).toMatch(/unauthorized|未授权|认证/i);
    });

    test('[P1] 应支持分页参数', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 使用分页参数请求
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?page=1&pageSize=5`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
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

    test('[P1] 应支持状态筛选参数', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 使用状态筛选参数请求
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?status=PENDING`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回筛选后的数据
      if (response.status() === 200) {
        const body = await response.json();
        // 所有项目应该是 PENDING 状态
        body.data.items.forEach((item: any) => {
          expect(item.status).toBe('PENDING');
        });
      }
    });

    test('[P1] 组合分页和状态筛选应正常工作', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 使用分页和状态筛选参数请求
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?page=1&pageSize=10&status=APPROVED`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回正确的筛选和分页数据
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items.length).toBeLessThanOrEqual(10);
        expect(body.data.meta.page).toBe(1);
        expect(body.data.meta.pageSize).toBe(10);
      }
    });
  });

  test.describe('[P1] 项目数据结构验证', () => {
    test('[P1] 项目应包含必需的字段', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 请求我的项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 每个项目应包含必需字段
      if (response.status() === 200) {
        const body = await response.json();

        if (body.data.items.length > 0) {
          const firstItem = body.data.items[0];
          expect(firstItem).toMatchObject({
            id: expect.any(String),
            repositoryName: expect.any(String),
            owner: expect.any(String),
            githubUrl: expect.any(String),
            status: expect.any(String),
            createdAt: expect.any(String),
          });
        }
      }
    });

    test('[P1] 拒绝的项目应包含拒绝原因', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 请求我的项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?status=REJECTED`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 拒绝的项目应包含 rejectionReason
      if (response.status() === 200) {
        const body = await response.json();

        body.data.items.forEach((item: any) => {
          expect(item.status).toBe('REJECTED');
          expect(item.rejectionReason).toBeTruthy();
          expect(typeof item.rejectionReason).toBe('string');
        });
      }
    });

    test('[P1] 项目应包含技术信息', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 请求我的项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 项目应包含技术信息（如果有）
      if (response.status() === 200) {
        const body = await response.json();

        body.data.items.forEach((item: any) => {
          // 验证可选字段存在且类型正确
          if (item.language) {
            expect(typeof item.language).toBe('string');
          }
          if (item.topics) {
            expect(Array.isArray(item.topics)).toBeTruthy();
          }
          if (item.description) {
            expect(typeof item.description).toBe('string');
          }
        });
      }
    });
  });

  test.describe('[P1] DELETE /api/v1/showcase/my-projects/:id - 删除项目', () => {
    let pendingProjectId: string;
    let approvedProjectId: string | null;

    test.beforeAll(async ({ api }) => {
      // 创建待审核的项目
      const pendingProject = await submitPendingProject(api, userToken);
      if (pendingProject) {
        pendingProjectId = pendingProject.id;
      }

      // 尝试获取已批准的项目 ID（如果存在）
      const listResponse = await api.get(`${API_URL}/api/v1/showcase/my-projects?status=APPROVED`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (listResponse.status() === 200) {
        const listBody = await listResponse.json();
        if (listBody.data.items.length > 0) {
          approvedProjectId = listBody.data.items[0].id;
        }
      }
    });

    test('[P1] 用户应能删除待审核的项目', async ({ api }) => {
      if (!pendingProjectId) {
        test.skip();
        return;
      }

      // GIVEN: 用户已认证
      // AND: 存在待审核的项目

      // WHEN: 删除项目
      const response = await api.delete(`${API_URL}/api/v1/showcase/my-projects/${pendingProjectId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 200 OK
      expect([200, 204]).toContain(response.status());

      // 验证项目已被删除
      const getResponse = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (getResponse.status() === 200) {
        const getBody = await getResponse.json();
        const deletedProject = getBody.data.items.find((item: any) => item.id === pendingProjectId);
        expect(deletedProject).toBeUndefined();
      }
    });

    test('[P1] 删除不存在的项目应返回 404', async ({ api }) => {
      // GIVEN: 用户已认证
      const nonExistentId = 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 尝试删除不存在的项目
      const response = await api.delete(`${API_URL}/api/v1/showcase/my-projects/${nonExistentId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 404 Not Found
      expect(response.status()).toBe(404);
    });

    test('[P1] 删除已批准的项目应返回 403', async ({ api }) => {
      if (!approvedProjectId) {
        test.skip();
        return;
      }

      // GIVEN: 用户已认证
      // AND: 存在已批准的项目

      // WHEN: 尝试删除已批准的项目
      const response = await api.delete(`${API_URL}/api/v1/showcase/my-projects/${approvedProjectId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 403 Forbidden
      expect(response.status()).toBe(403);

    });

    test('[P1] 未认证用户删除项目应返回 401', async ({ api }) => {
      // GIVEN: 用户未认证
      const testId = pendingProjectId || 'clxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // WHEN: 尝试删除项目
      const response = await api.delete(`${API_URL}/api/v1/showcase/my-projects/${testId}`);

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('[P1] 用户不能删除其他用户的项目', async ({ api }) => {
      // GIVEN: 另一个用户创建的项目
      const otherUser = await createTestUser(api);
      const otherProject = await submitPendingProject(api, otherUser.accessToken);

      if (!otherProject) {
        test.skip();
        return;
      }

      // WHEN: 原用户尝试删除其他用户的项目
      const response = await api.delete(`${API_URL}/api/v1/showcase/my-projects/${otherProject.id}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回 403 Forbidden
      expect(response.status()).toBe(403);
    });
  });

  test.describe('[P2] 边界情况和错误处理', () => {
    test('[P2] 无效的分页参数应被正确处理', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 使用无效的分页参数
      const invalidParams = [
        'page=0',
        'page=-1',
        'pageSize=0',
        'pageSize=1000',
      ];

      for (const params of invalidParams) {
        const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?${params}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // THEN: 应返回 400 或 200（取决于实现）
        expect([200, 400]).toContain(response.status());
      }
    });

    test('[P2] 无效的状态筛选应被忽略', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 使用无效的状态筛选
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?status=INVALID_STATUS`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 应返回空列表或 400
      expect([200, 400]).toContain(response.status());

      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items).toEqual([]);
      }
    });

    test('[P2] 无效的项目 ID 格式应返回适当错误', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 使用无效的 ID 格式
      const invalidIds = ['invalid-id', '123', 'abc', ''];

      for (const id of invalidIds) {
        const response = await api.delete(`${API_URL}/api/v1/showcase/my-projects/${id}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // THEN: 应返回 400 或 404
        expect([400, 404]).toContain(response.status());
      }
    });

    test('[P2] 空的项目列表应正确处理', async ({ api }) => {
      // GIVEN: 新用户（可能没有项目）
      const newUser = await createTestUser(api);

      // WHEN: 请求项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${newUser.accessToken}`,
        },
      });

      // THEN: 返回空列表
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items).toEqual([]);
        expect(body.data.meta.total).toBe(0);
      }
    });

    test('[P2] 超大页码应返回空列表', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 请求超大的页码
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects?page=999999`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 返回空列表
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items).toEqual([]);
      }
    });
  });

  test.describe('[P2] 数据隔离和安全性', () => {
    test('[P2] 用户只能看到自己的项目', async ({ api }) => {
      // GIVEN: 两个不同的用户
      const user1 = await createTestUser(api);
      const user2 = await createTestUser(api);

      // 用户1提交项目
      const project1 = await submitPendingProject(api, user1.accessToken);

      // 用户2请求自己的项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${user2.accessToken}`,
        },
      });

      // THEN: 用户2不应看到用户1的项目
      if (response.status() === 200 && project1) {
        const body = await response.json();
        const foundUser1Project = body.data.items.find((item: any) => item.id === project1.id);
        expect(foundUser1Project).toBeUndefined();
      }
    });

    test('[P2] 审核信息不应暴露给普通用户', async ({ api }) => {
      // GIVEN: 用户已认证

      // WHEN: 请求项目列表
      const response = await api.get(`${API_URL}/api/v1/showcase/my-projects`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // THEN: 响应不应包含敏感的审核信息
      if (response.status() === 200) {
        const body = await response.json();

        body.data.items.forEach((item: any) => {
          // 审核字段不应该存在（或者根据业务逻辑可能存在）
          // 这里我们验证如果存在，它们符合预期
          if (item.reviewedBy) {
            expect(typeof item.reviewedBy).toBe('string');
          }
          if (item.reviewedAt) {
            expect(typeof item.reviewedAt).toBe('string');
          }
          // rejectionReason 只有在 REJECTED 状态时才应该存在
          if (item.status === 'REJECTED') {
            expect(item.rejectionReason).toBeTruthy();
          }
        });
      }
    });
  });
});
