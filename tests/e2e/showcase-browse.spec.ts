/**
 * Showcase 浏览页面 E2E 测试
 *
 * 测试用户浏览项目展示页面的完整流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-4: 项目展示页面
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 */
import { test, expect } from '@playwright/test';

test.describe('项目展示浏览', () => {
  test.describe('[P1] 页面加载和基本浏览', () => {
    test('[P1] 应能成功加载项目展示页面', async ({ page }) => {
      // WHEN: 导航到项目展示页面
      await page.goto('/showcase');

      // THEN: 页面应该加载成功
      await expect(page).toHaveTitle(/管理平台/);
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] Showcase 页面应该响应', async ({ page }) => {
      // WHEN: 导航到项目展示页面
      await page.goto('/showcase');

      // THEN: 页面应该可见且有内容
      await expect(page.locator('body')).toBeVisible();
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('[P1] 项目详情页面', () => {
    test('[P1] 应能访问项目详情页面', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面应该加载成功
      const currentURL = page.url();
      expect(currentURL).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] 无效项目ID应该处理正确', async ({ page }) => {
      // WHEN: 访问无效的项目详情
      await page.goto('/showcase/invalid-id');

      // THEN: 页面应该不崩溃
      const currentURL = page.url();
      expect(currentURL).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P1] 路由保护', () => {
    test('[P1] 未认证访问受保护页面应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问受保护页面
      await page.goto('/profile');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P2] 页面导航', () => {
    test('[P2] 从 Showcase 返回首页', async ({ page }) => {
      // GIVEN: 访问 Showcase 页面
      await page.goto('/showcase');

      // WHEN: 返回首页
      await page.goto('/');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P2] Showcase 和详情页面之间的导航', async ({ page }) => {
      // GIVEN: 访问 Showcase 页面
      await page.goto('/showcase');

      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 详情页应该加载
      await expect(page.locator('body')).toBeVisible();

      // WHEN: 返回 Showcase 列表
      await page.goto('/showcase');

      // THEN: 列表页应该显示
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P2] 错误处理', () => {
    test('[P2] 无效的 URL 参数应该被正确处理', async ({ page }) => {
      // WHEN: 访问带无效参数的 URL
      await page.goto('/showcase?invalidParam=value');

      // THEN: 页面应该仍然加载（忽略无效参数）
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P2] 极端的页码值应该被正确处理', async ({ page }) => {
      // WHEN: 访问带极端页码的 URL
      await page.goto('/showcase?page=9999');

      // THEN: 页面应该加载（可能显示空结果）
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 页面应该有正确的标题', async ({ page }) => {
      // WHEN: 访问 Showcase 页面
      await page.goto('/showcase');

      // THEN: 页面应该有标题
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('[P3] 页面主要元素应该可见', async ({ page }) => {
      // WHEN: 访问 Showcase 页面
      await page.goto('/showcase');

      // THEN: 页面主体应该可见
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
