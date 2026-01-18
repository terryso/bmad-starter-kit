/**
 * 相关项目 API 测试
 *
 * 测试 GET /api/v1/showcase/projects/:id/related 端点
 * 该接口返回与指定项目相关的推荐项目列表
 *
 * 知识库参考: testarch/knowledge/test-levels-framework.md (API Tests)
 */

import { test, expect, API_URL, createTestUser } from './fixtures';

test.describe('[P1] 相关项目 API', () => {
  let userToken: string;
  let approvedProjectId: string;

  test.beforeAll(async ({ api }) => {
    // 创建测试用户
    const user = await createTestUser(api);
    userToken = user.accessToken;

    // 提交一个测试项目
    const submitResponse = await api.post(`${API_URL}/api/v1/showcase/submit`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      data: {
        githubUrl: `https://github.com/test/related-${Date.now()}`,
      },
    });

    // 项目提交成功或已存在
    expect([201, 409]).toContain(submitResponse.status());

    if (submitResponse.status() === 201) {
      const body = await submitResponse.json();
      approvedProjectId = body.data.id;
    }
  });

  test.describe('[P1] GET /api/v1/showcase/projects/:id/related - 获取相关项目', () => {
    test('[P1] 应成功返回已审核项目的相关项目列表', async ({ api }) => {
      // GIVEN: 存在已审核的项目
      // (使用 beforeAll 中创建的项目)
      if (!approvedProjectId) {
        // 如果没有项目，先创建一个
        const submitResponse = await api.post(`${API_URL}/api/v1/showcase/submit`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: {
            githubUrl: `https://github.com/facebook/react`,
          },
        });

        if (submitResponse.status() === 201) {
          const body = await submitResponse.json();
          approvedProjectId = body.data.id;
        } else {
          // 尝试获取现有项目
          const listResponse = await api.get(`${API_URL}/api/v1/showcase/projects?limit=1`);
          const listBody = await listResponse.json();
          if (listBody.data.projects?.length > 0) {
            approvedProjectId = listBody.data.projects[0].id;
          }
        }
      }

      // WHEN: 请求相关项目列表
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${approvedProjectId}/related`
      );

      // THEN: 返回相关项目列表
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 200,
        message: '获取相关项目成功',
      });

      expect(body.data).toHaveProperty('projects');
      expect(Array.isArray(body.data.projects)).toBe(true);
    });

    test('[P1] 不存在的项目应返回 404', async ({ api }) => {
      // GIVEN: 使用无效的项目 ID
      const invalidId = '00000000-0000-0000-0000-000000000000';

      // WHEN: 请求相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${invalidId}/related`
      );

      // THEN: 返回 404
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('不存在');
    });

    test('[P1] 无效的项目 ID 格式应返回 400', async ({ api }) => {
      // GIVEN: 使用无效的 UUID 格式
      const invalidId = 'not-a-valid-uuid';

      // WHEN: 请求相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${invalidId}/related`
      );

      // THEN: 返回 400 或 422 (验证错误)
      expect([400, 422]).toContain(response.status());
    });

    test('[P2] 相关项目数量应该有上限限制', async ({ api }) => {
      // GIVEN: 存在已审核项目
      const getProjectsResponse = await api.get(`${API_URL}/api/v1/showcase/projects?limit=1`);
      const projectsData = await getProjectsResponse.json();

      if (projectsData.data.projects?.length > 0) {
        const projectId = projectsData.data.projects[0].id;

        // WHEN: 请求相关项目
        const response = await api.get(
          `${API_URL}/api/v1/showcase/projects/${projectId}/related`
        );

        // THEN: 返回的项目数量不应过多
        expect(response.status()).toBe(200);

        const body = await response.json();
        // 假设限制为 10 个
        expect(body.data.projects.length).toBeLessThanOrEqual(10);
      }
    });

    test('[P2] 无需认证即可访问', async ({ api }) => {
      // GIVEN: 公开的项目
      const getProjectsResponse = await api.get(`${API_URL}/api/v1/showcase/projects?limit=1`);
      const projectsData = await getProjectsResponse.json();

      if (projectsData.data.projects?.length > 0) {
        const projectId = projectsData.data.projects[0].id;

        // WHEN: 未认证用户请求相关项目
        const response = await api.get(
          `${API_URL}/api/v1/showcase/projects/${projectId}/related`
        );

        // THEN: 应成功返回
        expect(response.status()).toBe(200);
      }
    });
  });

  test.describe('[P2] 相关项目排序和分页', () => {
    test('[P2] 应支持 limit 参数控制返回数量', async ({ api }) => {
      // GIVEN: 存在已审核项目
      const getProjectsResponse = await api.get(`${API_URL}/api/v1/showcase/projects?limit=1`);
      const projectsData = await getProjectsResponse.json();

      if (projectsData.data.projects?.length > 0) {
        const projectId = projectsData.data.projects[0].id;

        // WHEN: 限制返回 3 个相关项目
        const response = await api.get(
          `${API_URL}/api/v1/showcase/projects/${projectId}/related?limit=3`
        );

        // THEN: 返回不超过 3 个项目
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.data.projects.length).toBeLessThanOrEqual(3);
      }
    });

    test('[P2] 应支持 offset 参数实现分页', async ({ api }) => {
      // GIVEN: 存在已审核项目
      const getProjectsResponse = await api.get(`${API_URL}/api/v1/showcase/projects?limit=1`);
      const projectsData = await getProjectsResponse.json();

      if (projectsData.data.projects?.length > 0) {
        const projectId = projectsData.data.projects[0].id;

        // WHEN: 使用 offset 跳过前 2 个结果
        const response = await api.get(
          `${API_URL}/api/v1/showcase/projects/${projectId}/related?offset=2`
        );

        // THEN: 应返回分页结果
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.data).toHaveProperty('projects');
      }
    });
  });
});
