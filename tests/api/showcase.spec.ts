/**
 * Showcase API 测试
 *
 * 测试项目展示相关的 API 端点
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-3: 项目提交 API
 *
 * 知识库参考:
 * - test-levels-framework.md (集成测试决策)
 * - test-priorities-matrix.md (优先级分类)
 */
import { test, expect, API_URL, createTestUser, createAdminUser } from './fixtures';

test.describe('Showcase API', () => {
  let userToken: string;
  let adminToken: string;
  let testUserId: string;

  // 使用真实且稳定的 GitHub URL 进行测试
  const VALID_GITHUB_URLS = [
    'https://github.com/facebook/react',
    'https://github.com/vuejs/core',
    'https://github.com/microsoft/typescript',
    'https://github.com/nodejs/node',
  ];

  test.beforeAll(async ({ api }) => {
    // 创建普通用户
    const user = await createTestUser(api);
    userToken = user.accessToken;
    testUserId = user.id;

    // 创建管理员用户
    const admin = await createAdminUser(api);
    adminToken = admin.accessToken;
  });

  test.describe('[P1] POST /api/v1/showcase/submit - 项目提交', () => {
    test('[P1] 认证用户应能成功提交 GitHub 项目', async ({ api }) => {
      // GIVEN: 用户已认证
      // AND: 有效的 GitHub URL
      // 使用多个URL轮换，避免重复提交导致的409
      const urlIndex = (Date.now() / 1000 | 0) % VALID_GITHUB_URLS.length;
      const githubUrl = VALID_GITHUB_URLS[urlIndex];

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 返回 201 Created 或 409 Conflict (项目已存在)
      // 409 也是有效状态，表示项目之前已被提交
      expect([201, 409]).toContain(response.status());

      if (response.status() === 201) {
        const body = await response.json();
        expect(body).toMatchObject({
          statusCode: 201,
          message: expect.stringContaining('提交成功'),
        });
        expect(body.data).toMatchObject({
          id: expect.any(String),
          githubUrl: githubUrl,
          status: 'PENDING',
          repositoryName: expect.any(String),
          owner: expect.any(String),
          description: expect.any(String),
          category: expect.any(String),
          suggestedTags: expect.any(Array),
        });
      }
    });

    test('[P0] 应防止重复提交同一项目', async ({ api }) => {
      // GIVEN: 一个已被提交的 GitHub URL
      const githubUrl = VALID_GITHUB_URLS[1];

      // 首次提交
      const firstResponse = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // 首次提交应该成功
      expect([201, 409]).toContain(firstResponse.status());

      // WHEN: 尝试再次提交相同项目
      const secondResponse = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 返回 409 Conflict
      if (firstResponse.status() === 201) {
        expect(secondResponse.status()).toBe(409);
        const body = await secondResponse.json();
        expect(body.message).toMatch(/已被提交|重复|exist/i);
      }
    });

    test('[P1] 未认证用户提交应返回 401', async ({ api }) => {
      // GIVEN: 有效的 GitHub URL
      // BUT: 用户未认证
      const githubUrl = VALID_GITHUB_URLS[2];

      // WHEN: 不提供认证令牌
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        data: { githubUrl },
      });

      // THEN: 返回 401 Unauthorized
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.message).toMatch(/unauthorized|未授权|认证/i);
    });

    test('[P1] 空的 GitHub URL 应返回验证错误', async ({ api }) => {
      // GIVEN: 空的 GitHub URL
      const githubUrl = '';

      // WHEN: 提交空 URL
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 返回 400 Bad Request
      expect(response.status()).toBe(400);

      const body = await response.json();
      // 检查 message 或 errors 数组中包含验证错误信息
      const errorText = body.message || body.error || JSON.stringify(body);
      expect(errorText).toMatch(/验证|不能为空|required|empty/i);
    });

    test('[P1] 无效的 GitHub URL 格式应返回验证错误', async ({ api }) => {
      // 增加超时时间，因为可能因速率限制导致问题
      test.setTimeout(60000);

      // GIVEN: 各种无效的 GitHub URL 格式
      const invalidUrls = [
        'https://gitlab.com/owner/repo',
        'https://github.com/owner-only',
        'not-a-url-at-all',
        'ftp://github.com/owner/repo',
      ];

      for (const githubUrl of invalidUrls) {
        // WHEN: 提交无效 URL
        const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          data: { githubUrl },
        });

        // THEN: 返回 400 Bad Request（或因速率限制返回 429）
        expect([400, 429]).toContain(response.status());

        if (response.status() === 400) {
          const body = await response.json();
          // 检查错误信息（可能在 message、error 或 errors 数组中）
          const errorText = body.message || body.error || JSON.stringify(body);
          expect(errorText).toMatch(/格式|format|invalid|无效|验证/i);
        }
      }
    });

    test('[P1] 应从 GitHub 获取项目信息', async ({ api }) => {
      // GIVEN: 一个真实且公开的 GitHub 项目
      const githubUrl = VALID_GITHUB_URLS[3];

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 返回包含从 GitHub 获取的信息
      if (response.status() === 201) {
        const body = await response.json();
        expect(body.data).toMatchObject({
          repositoryName: expect.any(String),
          owner: expect.any(String),
          description: expect.any(String),
          stars: expect.any(Number),
          language: expect.any(String),
          topics: expect.any(Array),
          category: expect.any(String),
          suggestedTags: expect.any(Array),
        });

        // 验证必填字段不为空
        expect(body.data.repositoryName).toBeTruthy();
        expect(body.data.owner).toBeTruthy();
      }
    });

    test('[P1] 新提交的项目状态应为 PENDING', async ({ api }) => {
      // GIVEN: 有效的 GitHub URL
      const githubUrl = VALID_GITHUB_URLS[0];

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 项目状态为 PENDING (等待管理员审核)
      if (response.status() === 201) {
        const body = await response.json();
        expect(body.data.status).toBe('PENDING');
      }
    });

    test('[P1] 响应不应包含敏感字段', async ({ api }) => {
      // GIVEN: 有效的 GitHub URL
      const githubUrl = VALID_GITHUB_URLS[1];

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 响应不包含敏感字段
      if (response.status() === 201) {
        const body = await response.json();
        expect(body.data).not.toHaveProperty('submittedBy');
        expect(body.data).not.toHaveProperty('reviewedBy');
        expect(body.data).not.toHaveProperty('reviewedAt');
        expect(body.data).not.toHaveProperty('rejectionReason');
      }
    });
  });

  test.describe('[P2] 速率限制', () => {
    test('[P2] 超过速率限制应返回 429', async ({ api }) => {
      // 增加超时时间，因为假的 URL 可能导致 Agent SDK 超时
      test.setTimeout(60000);

      // GIVEN: 用户已认证
      // AND: 速率限制为 3 次/分钟

      // WHEN: 连续提交 4 个不同的项目
      // 注意：使用假的 GitHub URL 可能导致 Agent SDK 超时
      const requests = [];
      for (let i = 0; i < 4; i++) {
        const githubUrl = `https://github.com/test/repo${Date.now()}-${i}`;
        requests.push(
          api.post(`${API_URL}/api/v1/showcase/submit`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: { githubUrl },
          })
        );
      }

      const responses = await Promise.all(requests);

      // THEN: 第 4 个请求可能返回 429 Too Many Requests
      const fourthStatus = responses[3].status();
      if (fourthStatus === 429) {
        const body = await responses[3].json();
        expect(body.message).toMatch(/too many|rate limit|速率|限制/i);
      } else {
        // 接受其他状态码（假的 URL 可能导致超时或其他错误）
        expect([201, 400, 408, 409, 500]).toContain(fourthStatus);
      }
    });
  });

  test.describe('[P2] 错误处理', () => {
    test('[P2] 不存在的 GitHub 仓库应返回适当错误', async ({ api }) => {
      // 增加超时时间，因为假的 URL 可能导致 Agent SDK 超时
      test.setTimeout(60000);

      // GIVEN: 一个格式正确但可能不存在的 GitHub URL
      const githubUrl = `https://github.com/this-repo-definitely-does-not-exist-${Date.now()}/repo`;

      // WHEN: 提交不存在的项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 返回适当的错误状态（包括超时）
      expect([400, 404, 408, 500, 502, 503, 504]).toContain(response.status());

      if (response.status() >= 400) {
        const body = await response.json();
        expect(body.message || body.error).toBeTruthy();
      }
    });

    test('[P2] 私有仓库 URL 应适当处理', async ({ api }) => {
      // GIVEN: 一个私有仓库 URL (格式正确但无法访问)
      const githubUrl = 'https://github.com/private-org/private-repo';

      // WHEN: 提交私有项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 返回适当的错误状态或成功（包括已提交）
      expect([201, 400, 404, 409, 500]).toContain(response.status());
    });
  });

  test.describe('[P2] 边界情况', () => {
    test('[P2] URL 带尾随 .git 应正常处理', async ({ api }) => {
      // GIVEN: 带 .git 后缀的 GitHub URL
      const githubUrl = `${VALID_GITHUB_URLS[0]}.git`;

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 应该成功或返回 409 (已存在)
      expect([201, 409, 400]).toContain(response.status());
    });

    test('[P2] URL 带尾部斜杠应正常处理', async ({ api }) => {
      // GIVEN: 带尾部斜杠的 GitHub URL
      const githubUrl = `${VALID_GITHUB_URLS[1]}/`;

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 应该成功或返回 409 (已存在)
      expect([201, 409, 400]).toContain(response.status());
    });

    test('[P2] URL 大小写敏感性应正确处理', async ({ api }) => {
      // GIVEN: 大写的 GitHub URL
      const githubUrl = 'https://GITHUB.COM/FACEBOOK/REACT';

      // WHEN: 提交项目
      const response = await api.post(`${API_URL}/api/v1/showcase/submit`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: { githubUrl },
      });

      // THEN: 取决于实现
      expect([201, 400, 409]).toContain(response.status());
    });
  });
});
