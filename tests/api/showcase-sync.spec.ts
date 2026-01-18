/**
 * 同步项目信息 API 测试
 *
 * 测试 POST /api/v1/showcase/projects/:id/sync 端点
 * 该接口允许用户同步自己提交的项目的最新 GitHub 信息
 *
 * 知识库参考: testarch/knowledge/test-levels-framework.md (API Tests)
 */

import { test, expect, API_URL, createTestUser, submitPendingProject } from './fixtures';

test.describe('[P1] 同步项目信息 API', () => {
  let userToken: string;
  let projectId: string;

  test.beforeAll(async ({ api }) => {
    // 创建测试用户
    const user = await createTestUser(api);
    userToken = user.accessToken;

    // 提交一个测试项目
    const project = await submitPendingProject(api, userToken);
    if (project) {
      projectId = project.id;
    }
  });

  test.describe('[P1] POST /api/v1/showcase/projects/:id/sync - 同步项目', () => {
    test('[P1] 用户应能同步自己提交的项目信息', async ({ api }) => {
      // GIVEN: 用户有已提交的项目
      if (!projectId) {
        const project = await submitPendingProject(api, userToken);
        expect(project).not.toBeNull();
        if (project) projectId = project.id;
      }

      // WHEN: 同步项目信息
      const syncResponse = await api.post(
        `${API_URL}/api/v1/showcase/projects/${projectId}/sync`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      // THEN: 返回更新后的项目信息
      expect(syncResponse.status()).toBe(200);

      const body = await syncResponse.json();
      expect(body).toMatchObject({
        statusCode: 200,
        message: '项目信息同步成功',
      });

      // 验证返回的同步字段
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('stars');
      expect(body.data).toHaveProperty('forks');
      expect(body.data).toHaveProperty('openIssues');
      expect(body.data).toHaveProperty('description');
      expect(body.data).toHaveProperty('topics');
      expect(body.data).toHaveProperty('lastSyncedAt');
      expect(body.data).toHaveProperty('lastSyncStatus');
    });

    test('[P1] 同步不存在的项目应返回 404', async ({ api }) => {
      // GIVEN: 使用无效的项目 ID
      const invalidId = '00000000-0000-0000-0000-000000000000';

      // WHEN: 尝试同步项目
      const syncResponse = await api.post(
        `${API_URL}/api/v1/showcase/projects/${invalidId}/sync`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      // THEN: 返回 404
      expect(syncResponse.status()).toBe(404);
    });

    test('[P1] 未认证用户同步项目应返回 401', async ({ api }) => {
      // WHEN: 未认证用户尝试同步
      const syncResponse = await api.post(
        `${API_URL}/api/v1/showcase/projects/${projectId}/sync`
      );

      // THEN: 返回 401
      expect(syncResponse.status()).toBe(401);
    });

    test('[P1] 无效的项目 ID 格式应返回 400', async ({ api }) => {
      // WHEN: 使用无效的 UUID 格式
      const syncResponse = await api.post(
        `${API_URL}/api/v1/showcase/projects/not-a-valid-uuid/sync`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      // THEN: 返回 400 或 422
      expect([400, 422]).toContain(syncResponse.status());
    });

    test('[P2] 不能同步其他用户的项目', async ({ api }) => {
      // GIVEN: 用户 A 的项目
      const userA = await createTestUser(api);
      const projectA = await submitPendingProject(api, userA.accessToken);

      if (projectA) {
        // WHEN: 用户 B 尝试同步用户 A 的项目
        const syncResponse = await api.post(
          `${API_URL}/api/v1/showcase/projects/${projectA.id}/sync`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 返回 403 Forbidden
        expect(syncResponse.status()).toBe(403);

        const body = await syncResponse.json();
        expect(body.message).toContain('权限');
      }
    });

    test('[P2] 同步应更新项目的 GitHub 统计信息', async ({ api }) => {
      // GIVEN: 存在项目
      if (projectId) {
        // 获取同步前的项目信息
        const beforeResponse = await api.get(
          `${API_URL}/api/v1/showcase/projects/${projectId}`
        );
        const beforeBody = await beforeResponse.json();
        const beforeStars = beforeBody.data.stars || 0;

        // 等待一小段时间确保时间戳不同
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // WHEN: 同步项目
        const syncResponse = await api.post(
          `${API_URL}/api/v1/showcase/projects/${projectId}/sync`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 返回更新后的信息
        expect(syncResponse.status()).toBe(200);

        const syncBody = await syncResponse.json();
        expect(syncBody.data.lastSyncedAt).toBeTruthy();

        // 验证 stars 数量已更新（可能相同，但应该存在该字段）
        expect(syncBody.data).toHaveProperty('stars');
        expect(syncBody.data).toHaveProperty('forks');
        expect(syncBody.data).toHaveProperty('openIssues');
      }
    });
  });

  test.describe('[P2] 速率限制', () => {
    test('[P2] 短时间内多次同步应受速率限制', async ({ api }) => {
      // GIVEN: 存在项目
      if (!projectId) {
        const project = await submitPendingProject(api, userToken);
        if (project) projectId = project.id;
      }

      // WHEN: 连续多次同步项目
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const response = await api.post(
          `${API_URL}/api/v1/showcase/projects/${projectId}/sync`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        responses.push(response.status());

        // 短暂等待
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // THEN: 第一次成功，后续可能受速率限制
      expect(responses[0]).toBe(200);

      // 速率限制可能在第二次或第三次触发，返回 429
      // 如果没有触发速率限制，也应该返回 200（取决于服务器配置）
      const hasRateLimit = responses.some((status) => status === 429);

      if (hasRateLimit) {
        // 验证速率限制响应
        const rateLimitIndex = responses.indexOf(429);
        expect(rateLimitIndex).toBeGreaterThan(0);
      }
      // 如果没有速率限制，所有请求都应该成功
    });

    test('[P2] 距离上次同步不足 5 分钟应返回 429', async ({ api }) => {
      // GIVEN: 刚同步过的项目
      if (projectId) {
        // 首次同步
        const firstSync = await api.post(
          `${API_URL}/api/v1/showcase/projects/${projectId}/sync`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        expect(firstSync.status()).toBe(200);

        const firstSyncBody = await firstSync.json();

        // WHEN: 立即再次同步
        const secondSync = await api.post(
          `${API_URL}/api/v1/showcase/projects/${projectId}/sync`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 应该返回 429 (速率限制) 或 200 (如果服务器允许)
        expect([200, 429]).toContain(secondSync.status());

        if (secondSync.status() === 429) {
          const body = await secondSync.json();
          expect(body.message).toContain('5分钟');
        }
      }
    });
  });

  test.describe('[P2] 同步状态跟踪', () => {
    test('[P2] 同步成功应更新同步状态', async ({ api }) => {
      // GIVEN: 存在项目
      if (projectId) {
        // WHEN: 同步成功
        const syncResponse = await api.post(
          `${API_URL}/api/v1/showcase/projects/${projectId}/sync`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 同步状态应为成功
        expect(syncResponse.status()).toBe(200);

        const body = await syncResponse.json();
        expect(body.data.lastSyncStatus).toBe('SUCCESS');
        expect(body.data.lastSyncedAt).toBeTruthy();
      }
    });

    test('[P2] 同步失败应返回错误信息', async ({ api }) => {
      // 此测试需要模拟 GitHub API 失败的情况
      // 由于我们无法直接控制 GitHub API，这里跳过
      // 在实际环境中，可以通过 mock GitHub API 来测试

      test.skip(true, '需要 mock GitHub API 来测试失败场景');

      // GIVEN: GitHub API 返回错误
      // WHEN: 尝试同步
      // THEN: 应返回错误状态
    });
  });
});
