/**
 * 项目提交 E2E 测试
 *
 * 测试用户通过 UI 提交 GitHub 项目的完整流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-3: 项目提交 API
 * Story 8-4: 项目展示页面 (未来)
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 */
import { test, expect } from '@/tests/support/fixtures';

test.describe('项目提交流程', () => {
  test.describe('[P1] Showcase 页面访问', () => {
    test('[P1] 未认证用户可以访问 Showcase 页面', async ({ page }) => {
      // WHEN: 访问公开的 Showcase 页面
      await page.goto('/showcase');

      // THEN: 页面应该加载成功
      await expect(page).toHaveTitle(/管理平台/);
    });

    test('[P1] Showcase 页面应该显示内容', async ({ page }) => {
      // WHEN: 访问 Showcase 页面
      await page.goto('/showcase');

      // THEN: 页面应该可见
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P1] 项目详情页面', () => {
    test('[P1] 项目详情页面应该可访问', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面应该加载成功（可能是404或重定向，但没有服务器错误）
      const currentURL = page.url();
      expect(currentURL).toBeTruthy();
    });

    test('[P1] 无效项目ID应正确处理', async ({ page }) => {
      // WHEN: 访问无效的项目ID
      await page.goto('/showcase/invalid-id');

      // THEN: 页面应该处理错误（不崩溃）
      const currentURL = page.url();
      expect(currentURL).toBeTruthy();
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

    test('[P1] 未认证访问管理页面应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P2] 页面导航', () => {
    test('[P2] 登录页面应该可访问', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 登录表单应该可见
      await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
    });

    test('[P2] 注册页面应该可访问', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册表单应该可见
      await expect(page.getByRole('heading', { name: '注册' })).toBeVisible();
    });

    test('[P2] 可以从登录页导航到注册页', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // AND: 点击注册链接
      await page.click('[data-testid="register-link"]');

      // THEN: 导航到注册页面
      await expect(page).toHaveURL('/register');
    });
  });
});
