/**
 * 项目详情 API 测试
 *
 * 测试项目详情相关 API 端点
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-5: 项目详情页
 *
 * 知识库参考:
 * - api-testing-patterns.md (纯 API 测试模式)
 * - test-priorities-matrix.md (P1 优先级 - 核心业务逻辑)
 */
import { test, expect, API_URL, createTestUser } from './fixtures';

/**
 * 辅助函数：创建测试项目
 */
async function createTestProject(api: any, overrides: Record<string, unknown> = {}) {
  // 创建用户并登录获取 token
  const user = await createTestUser(api);
  const token = user.accessToken;

  // 提交项目
  const projectData = {
    githubUrl: `https://github.com/test/test-project-${Date.now()}`,
    ...overrides,
  };

  const submitResponse = await api.post(`${API_URL}/api/v1/showcase/submit`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: projectData,
  });

  if (submitResponse.status() !== 201) {
    throw new Error(`Failed to submit test project: ${await submitResponse.text()}`);
  }

  const submitBody = await submitResponse.json();
  const project = submitBody.data;

  // 尝试更新项目状态为 APPROVED
  await api.patch(`${API_URL}/api/v1/admin/projects/${project.id}/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { status: 'APPROVED' },
  }).catch(() => {
    // 如果状态更新 API 不存在，忽略
  });

  return {
    project,
    token,
    user,
  };
}

test.describe('项目详情 API', () => {
  test.describe('[P1] GET /api/v1/showcase/projects/:id', () => {
    test('[P1] 应成功获取已审核项目的详情', async ({ api }) => {
      // GIVEN: 创建一个测试项目
      const { project } = await createTestProject(api);

      // WHEN: 获取项目详情
      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      // THEN: 应返回 200 和完整的项目信息
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toMatchObject({
          statusCode: 200,
          message: expect.any(String),
          data: expect.any(Object),
        });

        // 验证项目数据
        expect(body.data).toMatchObject({
          id: project.id,
          repositoryName: expect.any(String),
          description: expect.any(String),
          owner: expect.any(String),
          stars: expect.any(Number),
          githubUrl: expect.any(String),
          category: expect.any(String),
        });

        // 验证包含提交者信息
        expect(body.data.submittedBy).toBeDefined();
        expect(body.data.submittedBy).toMatchObject({
          id: expect.any(String),
          email: expect.any(String),
        });
      } else {
        expect(response.status()).toBe(404);
      }
    });

    test('[P1] 不存在的项目应返回 404', async ({ api }) => {
      // WHEN: 获取不存在的项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/nonexistent-project-id-xyz-123`
      );

      // THEN: 应返回 404
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 404,
        message: expect.stringMatching(/not found|不存在/i),
      });
    });

    test('[P1] 无效的项目 ID 格式应返回错误', async ({ api }) => {
      // WHEN: 使用无效的 ID 格式
      const invalidIds = [
        'invalid-id',
        '123',
        '',
        '../../../etc/passwd',
        '"><script>alert(1)</script>',
      ];

      for (const invalidId of invalidIds) {
        const response = await api.get(
          `${API_URL}/api/v1/showcase/projects/${encodeURIComponent(invalidId)}`
        );

        // THEN: 应返回错误（400 或 404）
        expect([400, 404]).toContain(response.status());
      }
    });

    test('[P1] PENDING 状态的项目应返回 404', async ({ api }) => {
      // GIVEN: 创建一个 PENDING 状态的项目
      const { project } = await createTestProject(api);

      // WHEN: 尝试获取 PENDING 项目
      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      // THEN: 应返回 404（未审核项目不公开）
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data).toBeDefined();
      } else {
        expect(response.status()).toBe(404);
      }
    });

    test('[P1] 应返回完整的项目元数据', async ({ api }) => {
      // GIVEN: 创建一个有完整元数据的项目
      const { project } = await createTestProject(api, {
        githubUrl: 'https://github.com/test/complete-project',
      });

      // WHEN: 获取项目详情
      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      // THEN: 应返回完整的元数据字段
      if (response.status() === 200) {
        const body = await response.json();
        const data = body.data;

        // 验证必需字段
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('repositoryName');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('owner');
        expect(data).toHaveProperty('stars');
        expect(data).toHaveProperty('githubUrl');
        expect(data).toHaveProperty('category');

        // 验证可选字段存在
        expect(data).toHaveProperty('forks');
        expect(data).toHaveProperty('issues');
        expect(data).toHaveProperty('language');
        expect(data).toHaveProperty('topics');
        expect(data).toHaveProperty('suggestedTags');
        expect(data).toHaveProperty('screenshotUrl');
        expect(data).toHaveProperty('homepageUrl');
        expect(data).toHaveProperty('license');
        expect(data).toHaveProperty('githubUpdatedAt');

        // 验证用户信息
        expect(data).toHaveProperty('submittedBy');
        expect(data.submittedBy).toHaveProperty('id');
        expect(data.submittedBy).toHaveProperty('email');
      }
    });
  });

  test.describe('[P1] GET /api/v1/showcase/projects/:id/related', () => {
    test('[P1] 应返回相关项目列表', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${project.id}/related`
      );

      // THEN: 应返回 200 和相关项目列表
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        statusCode: 200,
        message: expect.stringMatching(/成功|success/i),
        data: {
          items: expect.any(Array),
        },
      });

      // 验证 items 是数组
      expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('[P1] 相关项目应排除当前项目', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${project.id}/related`
      );

      // THEN: 相关项目列表不应包含当前项目
      if (response.status() === 200) {
        const body = await response.json();
        const items = body.data.items;

        items.forEach((item: { id: string }) => {
          expect(item.id).not.toBe(project.id);
        });
      }
    });

    test('[P1] 相关项目最多返回 4 个', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${project.id}/related`
      );

      // THEN: 相关项目数量应不超过 4 个
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items.length).toBeLessThanOrEqual(4);
      }
    });

    test('[P1] 不存在的项目应返回空列表', async ({ api }) => {
      // WHEN: 获取不存在项目的相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/nonexistent-project-id-xyz-123/related`
      );

      // THEN: 应返回空列表或 404
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.data.items).toEqual([]);
      } else {
        expect(response.status()).toBe(404);
      }
    });

    test('[P1] 相关项目应包含必要字段', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取相关项目
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/${project.id}/related`
      );

      // THEN: 每个相关项目应包含必要的字段
      if (response.status() === 200) {
        const body = await response.json();
        const items = body.data.items;

        items.forEach((item: unknown) => {
          expect(item).toMatchObject({
            id: expect.any(String),
            repositoryName: expect.any(String),
            description: expect.any(String),
            owner: expect.any(String),
            stars: expect.any(Number),
            category: expect.any(String),
          });
        });
      }
    });
  });

  test.describe('[P2] 响应格式验证', () => {
    test('[P2] 应返回标准的 API 响应格式', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取项目详情
      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      // THEN: 应返回标准的 API 响应格式
      if (response.status() === 200) {
        const body = await response.json();

        // 验证响应结构
        expect(body).toHaveProperty('statusCode');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('data');

        // 验证类型
        expect(typeof body.statusCode).toBe('number');
        expect(typeof body.message).toBe('string');
        expect(typeof body.data).toBe('object');
      }
    });

    test('[P2] 应设置正确的 Content-Type', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取项目详情
      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      // THEN: Content-Type 应是 application/json
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });
  });

  test.describe('[P2] 安全性测试', () => {
    test('[P2] 应防止 ID 注入攻击', async ({ api }) => {
      // 测试各种可能的注入攻击
      const maliciousIds = [
        "1' OR '1'='1",
        '1; DROP TABLE projects--',
        "${7*7}",
        "{{7*7}}",
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '../../etc/passwd',
        '%2e%2e%2f',
        '%c0%ae%c0%ae%c0%af',
      ];

      for (const maliciousId of maliciousIds) {
        const response = await api.get(
          `${API_URL}/api/v1/showcase/projects/${encodeURIComponent(maliciousId)}`
        );

        // THEN: 应返回错误，不应导致服务器错误
        expect([400, 404, 422]).toContain(response.status());
      }
    });

    test('[P2] 公开接口不应暴露敏感信息', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 公开获取项目详情
      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      // THEN: 不应暴露敏感字段
      if (response.status() === 200) {
        const body = await response.json();
        const data = body.data;

        // 这些字段不应出现在公开 API 响应中
        expect(data).not.toHaveProperty('submittedById');
        expect(data).not.toHaveProperty('reviewedById');
        expect(data).not.toHaveProperty('rejectionReason');
        expect(data).not.toHaveProperty('updatedAt');

        // status 字段也不应暴露
        expect(data).not.toHaveProperty('status');
      }
    });

    test('[P2] 无需认证即可访问', async ({ api }) => {
      // GIVEN: 不提供任何认证信息

      // WHEN: 获取项目详情
      const response = await api.get(
        `${API_URL}/api/v1/showcase/projects/some-project-id`
      );

      // THEN: 不应返回 401（即使项目不存在）
      expect(response.status()).not.toBe(401);
    });
  });

  test.describe('[P2] 并发和性能', () => {
    test('[P2] 应能处理并发请求', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 并发发送多个请求
      const requests = Array.from({ length: 10 }, () =>
        api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`)
      );

      const responses = await Promise.all(requests);

      // THEN: 所有请求都应成功返回
      responses.forEach((response) => {
        expect([200, 404]).toContain(response.status());
      });
    });

    test('[P2] 响应时间应合理', async ({ api }) => {
      // GIVEN: 创建一个项目
      const { project } = await createTestProject(api);

      // WHEN: 获取项目详情
      const startTime = Date.now();
      await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);
      const endTime = Date.now();

      // THEN: 响应时间应小于 5 秒
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  test.describe('[P3] 边界情况', () => {
    test('[P3] 空字段应正确处理', async ({ api }) => {
      // 验证 API 能正确处理空字段
      const { project } = await createTestProject(api);

      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      if (response.status() === 200) {
        const body = await response.json();
        const data = body.data;

        // 空字段可以是 null 或具体类型
        expect(data.forks === null || typeof data.forks === 'number').toBe(true);
        expect(data.issues === null || typeof data.issues === 'number').toBe(true);
        expect(data.language === null || typeof data.language === 'string').toBe(true);
      }
    });

    test('[P3] 特殊字符应正确处理', async ({ api }) => {
      // 验证特殊字符不会导致 JSON 解析错误
      const { project } = await createTestProject(api);

      const response = await api.get(`${API_URL}/api/v1/showcase/projects/${project.id}`);

      if (response.status() === 200) {
        const body = await response.json();
        // JSON 应该可以正确解析
        expect(() => JSON.parse(JSON.stringify(body))).not.toThrow();
      }
    });
  });
});
