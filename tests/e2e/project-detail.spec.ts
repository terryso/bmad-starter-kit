/**
 * 项目详情页 E2E 测试
 *
 * 测试用户查看项目详情的完整流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-5: 项目详情页
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (P0-P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 */
import { test, expect } from '@playwright/test';

test.describe('项目详情页', () => {
  // 有效项目 ID 用于测试 (实际项目中应该通过 API 创建测试数据)
  const VALID_PROJECT_ID = 'test-project-id';
  const NON_EXISTENT_PROJECT_ID = 'nonexistent-project-id-xyz-123';

  test.describe('[P0] 页面加载和基本显示', () => {
    test('[P0] 应能成功加载已审核项目的详情页', async ({ page }) => {
      // GIVEN: 数据库中存在一个 APPROVED 状态的项目
      // 通过 mock API 返回测试数据
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          // 相关项目 API
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: {
                items: [
                  {
                    id: 'related-project-1',
                    repositoryName: 'Related Project 1',
                    description: 'A related project',
                    owner: 'testuser',
                    stars: 100,
                    language: 'TypeScript',
                    category: 'WEB_APP',
                    screenshotUrl: null,
                  },
                ],
              },
            }),
          });
        } else {
          // 项目详情 API
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'bmad-starter-kit',
                description: 'A starter kit for BMAD framework',
                owner: 'anthropics',
                stars: 1234,
                forks: 56,
                issues: 12,
                language: 'TypeScript',
                topics: ['bmad', 'starter-kit', 'framework'],
                category: 'WEB_APP',
                suggestedTags: ['bmad', 'framework'],
                screenshotUrl: null,
                homepageUrl: 'https://bmad.dev',
                license: 'MIT',
                githubUrl: 'https://github.com/anthropics/bmad-starter-kit',
                createdAt: '2024-01-17T10:00:00.000Z',
                githubUpdatedAt: '2024-01-15T10:30:00.000Z',
                submittedBy: {
                  id: 'user-123',
                  name: 'Test User',
                  email: 'test@example.com',
                },
                reviewedBy: {
                  id: 'admin-456',
                  name: 'Admin',
                  email: 'admin@example.com',
                },
                reviewedAt: '2024-01-18T10:00:00.000Z',
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示项目完整信息
      await expect(page.locator('h1')).toContainText('bmad-starter-kit');
      await expect(page.locator('text=/A starter kit for BMAD framework/')).toBeVisible();

      // AND: 应显示统计数据
      await expect(page.locator('text=/1234/')).toBeVisible(); // Stars
      await expect(page.locator('text=/56/')).toBeVisible(); // Forks
      await expect(page.locator('text=/12/')).toBeVisible(); // Issues

      // AND: 应显示项目元数据
      await expect(page.locator('text=/TypeScript/')).toBeVisible();
      await expect(page.locator('text=/MIT/')).toBeVisible();
    });

    test('[P0] 返回按钮应能正确导航', async ({ page }) => {
      // GIVEN: 数据库中存在 APPROVED 项目
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        if (route.request().url().includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Test Project',
                description: 'Test Description',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: null,
                githubUrl: 'https://github.com/test/test',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // 等待页面加载完成
      await expect(page.locator('h1')).toContainText('Test Project');

      // WHEN: 点击返回按钮
      const backButton = page.locator('button:has-text("返回"), a:has-text("返回")').first();
      await backButton.click();

      // THEN: 应导航回项目展示列表页
      await expect(page).toHaveURL('/showcase');
    });
  });

  test.describe('[P1] 错误处理', () => {
    test('[P1] 不存在的项目应显示 404 页面', async ({ page }) => {
      // GIVEN: 项目不存在
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        if (!route.request().url().includes('/related')) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 404,
              message: 'Project not found',
              error: 'Not Found',
            }),
          });
        }
      });

      // WHEN: 用户访问不存在的项目详情页
      await page.goto(`/showcase/${NON_EXISTENT_PROJECT_ID}`);

      // THEN: 应显示 404 错误页面
      await expect(page.locator('text=/404/')).toBeVisible();
      await expect(page.locator('text=/项目不存在/')).toBeVisible();

      // AND: 应有返回项目展示的按钮
      const backButton = page.locator('button:has-text("返回项目展示"), a:has-text("返回项目展示")');
      await expect(backButton).toBeVisible();
    });

    test('[P1] API 错误时应显示友好提示', async ({ page }) => {
      // GIVEN: API 返回错误
      await page.route('**/api/v1/showcase/projects/*', (route) =>
        route.abort('failed')
      );

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: React Query 应显示错误状态��重试机制
      // 由于 React Query 会重试，我们等待一段时间
      // 实际行为取决于 React Query 的配置
      await page.waitForTimeout(3000);

      // 应该显示 404 或错误页面（React Query 失败后的降级处理）
      const hasError = await page.locator('text=/404/').isVisible({ timeout: 1000 }).catch(() => false);
      const hasProjectNotFound = await page.locator('text=/项目不存在/').isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasError || hasProjectNotFound).toBe(true);
    });

    test('[P1] 网络超时时应显示适当提示', async ({ page }) => {
      // GIVEN: API 请求超时
      await page.route('**/api/v1/showcase/projects/*', () => {
        // 不响应，模拟超时
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示加载状态（骨架屏）
      await expect(page.locator('text=Test Project')).not.toBeVisible({ timeout: 5000 });

      // 骨架屏应该可见
      const skeleton = page.locator('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]').first();
      const isSkeletonVisible = await skeleton.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isSkeletonVisible).toBe(true);
    });
  });

  test.describe('[P1] GitHub 链接功能', () => {
    test('[P1] GitHub 按钮应在新标签页打开', async ({ page, context }) => {
      // GIVEN: 数据库中存在 APPROVED 项目
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        if (route.request().url().includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'bmad-starter-kit',
                description: 'Test description',
                owner: 'anthropics',
                stars: 1234,
                forks: 56,
                issues: 12,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: 'MIT',
                githubUrl: 'https://github.com/anthropics/bmad-starter-kit',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);
      await expect(page.locator('h1')).toContainText('bmad-starter-kit');

      // WHEN: 点击 GitHub 按钮
      const githubButton = page.locator('a:has-text("查看 GitHub"), button:has-text("查看 GitHub")').first();

      // 设置新页面监听
      const newPagePromise = context.waitForEvent('page');
      await githubButton.click();

      // THEN: 应在新标签页打开 GitHub
      const newPage = await newPagePromise;
      await expect(newPage).toHaveURL(/github\.com/);

      // 关闭新页面
      await newPage.close();
    });

    test('[P1] 应有正确的 GitHub URL', async ({ page }) => {
      // GIVEN: 数据库中存在项目
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        if (route.request().url().includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'test-repo',
                description: 'Test',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: 'https://test.dev',
                license: 'MIT',
                githubUrl: 'https://github.com/testuser/test-repo',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 加载项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: GitHub 按钮应有正确的 href
      const githubButton = page.locator('a:has-text("GitHub")').first();
      await expect(githubButton).toHaveAttribute('href', 'https://github.com/testuser/test-repo');
      await expect(githubButton).toHaveAttribute('target', '_blank');
      await expect(githubButton).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('[P1] 相关项目推荐', () => {
    test('[P1] 应显示相关项目推荐', async ({ page }) => {
      // GIVEN: 项目有相关项目
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          // 返回相关项目
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: {
                items: [
                  {
                    id: 'related-1',
                    repositoryName: 'Related Project 1',
                    description: 'First related project',
                    owner: 'user1',
                    stars: 500,
                    language: 'TypeScript',
                    category: 'WEB_APP',
                    screenshotUrl: null,
                  },
                  {
                    id: 'related-2',
                    repositoryName: 'Related Project 2',
                    description: 'Second related project',
                    owner: 'user2',
                    stars: 300,
                    language: 'TypeScript',
                    category: 'WEB_APP',
                    screenshotUrl: null,
                  },
                ],
              },
            }),
          });
        } else {
          // 项目详情
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Test Project',
                description: 'Test',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: null,
                githubUrl: 'https://github.com/test/test',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示"相关项目"区域
      await expect(page.locator('h2:has-text("相关项目")')).toBeVisible();

      // AND: 应显示相关项目卡片
      await expect(page.locator('text=/Related Project 1/')).toBeVisible();
      await expect(page.locator('text=/Related Project 2/')).toBeVisible();
    });

    test('[P1] 无相关项目时应显示友好提示', async ({ page }) => {
      // GIVEN: 项目没有相关项目
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          // 返回空列表
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Unique Project',
                description: 'A unique project',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: null,
                githubUrl: 'https://github.com/test/test',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示"相关项目"区域
      await expect(page.locator('h2:has-text("相关项目")')).toBeVisible();

      // AND: 应显示"暂无相关项目"提示
      await expect(page.locator('text=/暂无相关项目/')).toBeVisible();
    });

    test('[P1] 点击相关项目应导航到其详情页', async ({ page }) => {
      // GIVEN: 项目有相关项目
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: {
                items: [
                  {
                    id: 'related-project',
                    repositoryName: 'Related Project',
                    description: 'A related project',
                    owner: 'user1',
                    stars: 500,
                    language: 'TypeScript',
                    category: 'WEB_APP',
                    screenshotUrl: null,
                  },
                ],
              },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Test Project',
                description: 'Test',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: null,
                githubUrl: 'https://github.com/test/test',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // WHEN: 点击相关项目卡片
      const relatedProjectCard = page.locator('[href="/showcase/related-project"], a[href*="related-project"]').first();
      await relatedProjectCard.click();

      // THEN: 应导航到相关项目详情页
      await expect(page).toHaveURL('/showcase/related-project');
    });
  });

  test.describe('[P2] 加载状态', () => {
    test('[P2] 应显示骨架屏加载状态', async ({ page }) => {
      // GIVEN: API 响应较慢
      let resolveRoute: ((value: unknown) => void) | null = null;
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          // 暂时不响应，等待后续调用
          new Promise((resolve) => { resolveRoute = resolve; });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示骨架屏
      const skeleton = page.locator('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]').first();
      await expect(skeleton).toBeVisible();

      // 完成请求
      if (resolveRoute) {
        // 重新路由以完成请求
        await page.route('**/api/v1/showcase/projects/' + VALID_PROJECT_ID, async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Test Project',
                description: 'Test',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: null,
                githubUrl: 'https://github.com/test/test',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        });
        await page.reload();
      }

      // 骨架屏应该消��，显示实际内容
      await expect(page.locator('h1')).toContainText('Test Project', { timeout: 10000 });
    });
  });

  test.describe('[P2] 项目信息完整性', () => {
    test('[P2] 应显示项目完整元数据', async ({ page }) => {
      // GIVEN: 项目有完整的元数据
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Complete Project',
                description: 'A project with complete metadata',
                owner: 'testuser',
                stars: 1234,
                forks: 56,
                issues: 12,
                language: 'TypeScript',
                topics: ['react', 'frontend', 'ui'],
                category: 'WEB_APP',
                suggestedTags: ['bmad', 'starter-kit'],
                screenshotUrl: 'https://example.com/screenshot.png',
                homepageUrl: 'https://example.com',
                license: 'MIT',
                githubUrl: 'https://github.com/testuser/complete-project',
                createdAt: '2024-01-17T10:00:00.000Z',
                githubUpdatedAt: '2024-01-15T10:30:00.000Z',
                submittedBy: {
                  id: 'user-123',
                  name: 'Test User',
                  email: 'test@example.com',
                },
                reviewedBy: {
                  id: 'admin-456',
                  name: 'Admin User',
                  email: 'admin@example.com',
                },
                reviewedAt: '2024-01-18T10:00:00.000Z',
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示所有项目信息
      await expect(page.locator('h1')).toContainText('Complete Project');

      // 统计数据
      await expect(page.locator('text=/1234/')).toBeVisible(); // Stars
      await expect(page.locator('text=/56/')).toBeVisible(); // Forks
      await expect(page.locator('text=/12/')).toBeVisible(); // Issues

      // 元数据
      await expect(page.locator('text=/TypeScript/')).toBeVisible();
      await expect(page.locator('text=/MIT/')).toBeVisible();

      // 标签
      await expect(page.locator('text=/react/')).toBeVisible();
      await expect(page.locator('text=/frontend/')).toBeVisible();
      await expect(page.locator('text=/ui/')).toBeVisible();

      // 官网链接
      await expect(page.locator('a:has-text("访问项目官网")')).toBeVisible();
      await expect(page.locator('a:has-text("访问项目官网")')).toHaveAttribute('href', 'https://example.com');

      // 提交者信息
      await expect(page.locator('text=/Test User/')).toBeVisible();
    });

    test('[P2] 应显示空值字段的默认处理', async ({ page }) => {
      // GIVEN: 项目有部分空字段
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'Minimal Project',
                description: 'A project with minimal data',
                owner: 'testuser',
                stars: 100,
                forks: null,
                issues: null,
                language: null,
                topics: [],
                category: 'OTHER',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: null,
                githubUrl: 'https://github.com/testuser/minimal-project',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: {
                  id: 'user-123',
                  name: null,
                  email: 'test@example.com',
                },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 应显示 N/A 或默认值
      await expect(page.locator('text=/N/A/')).toBeVisible();
      await expect(page.locator('text=/test@example\\.com/')).toBeVisible();

      // 不应显示官网链接（因为 homepageUrl 为 null）
      await expect(page.locator('a:has-text("访问项目官网")')).not.toBeVisible();
    });
  });

  test.describe('[P2] URL 直接访问', () => {
    test('[P2] 直接访问详情页 URL 应正确加载', async ({ page }) => {
      // GIVEN: 项目存在
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: 'direct-access-project',
                repositoryName: 'Direct Access Project',
                description: 'Accessed via direct URL',
                owner: 'testuser',
                stars: 999,
                forks: 50,
                issues: 10,
                language: 'JavaScript',
                topics: ['direct'],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: 'Apache-2.0',
                githubUrl: 'https://github.com/test/direct-access',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: '2024-01-01T00:00:00.000Z',
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户直接访问详情页 URL（通过浏览器地址栏输入）
      await page.goto('/showcase/direct-access-project');

      // THEN: 应正确加载项目详情
      await expect(page.locator('h1')).toContainText('Direct Access Project');
      await expect(page).toHaveURL('/showcase/direct-access-project');
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 页面应有正确的可访问性结构', async ({ page }) => {
      // GIVEN: 项目存在
      await page.route('**/api/v1/showcase/projects/*', async (route) => {
        const url = route.request().url();
        if (url.includes('/related')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取相关项目成功',
              data: { items: [] },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 200,
              message: '获取项目详情成功',
              data: {
                id: VALID_PROJECT_ID,
                repositoryName: 'A11y Test Project',
                description: 'Testing accessibility',
                owner: 'testuser',
                stars: 100,
                forks: 10,
                issues: 5,
                language: 'TypeScript',
                topics: [],
                category: 'WEB_APP',
                suggestedTags: [],
                screenshotUrl: null,
                homepageUrl: null,
                license: 'MIT',
                githubUrl: 'https://github.com/test/a11y-test',
                createdAt: '2024-01-01T00:00:00.000Z',
                githubUpdatedAt: null,
                submittedBy: { id: '1', name: 'User', email: 'user@test.com' },
                reviewedBy: null,
                reviewedAt: null,
              },
            }),
          });
        }
      });

      // WHEN: 用户访问项目详情页
      await page.goto(`/showcase/${VALID_PROJECT_ID}`);

      // THEN: 页面应有正确的可访问性结构
      // 检查主要标题
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();

      // 检查 GitHub 链接有可访问的文本
      const githubLink = page.locator('a[href*="github"]:has-text("GitHub")');
      await expect(githubLink).toBeVisible();
    });
  });
});
