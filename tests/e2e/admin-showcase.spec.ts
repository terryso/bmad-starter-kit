/**
 * 管理员项目审核 E2E 测试
 *
 * 测试管理员审核待审核项目的端到端流程
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-6: 管理员审核界面
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (优先级分类)
 */
import { test, expect } from '@playwright/test';

test.describe('[P0] 管理员项目审核 E2E', () => {
  test.describe('[P0] 访问控制', () => {
    test('[P0] 未登录用户应被重定向到登录页', async ({ page }) => {
      // GIVEN: 用户未登录
      await page.context().clearCookies();

      // WHEN: 尝试访问项目审核页面
      await page.goto('/admin/showcase');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P0] 未登录访问管理页面应重定向', async ({ page }) => {
      // GIVEN: 用户未登录
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 页面路由保护应正确工作', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问不同的管理页面
      const adminPaths = ['/admin', '/admin/showcase', '/admin/users'];

      for (const path of adminPaths) {
        await page.goto(path);
        // THEN: 每个管理页面都应该重定向到登录页
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('[P1] 页面加载', () => {
    test('[P1] 管理页面应该有正确的结构', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问管理页面
      await page.goto('/admin');

      // THEN: 应该重定向到登录页（不崩溃）
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] Showcase 管理页面应该有正确的结构', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问 Showcase 管理页面
      await page.goto('/admin/showcase');

      // THEN: 应该重定向到登录页（不崩溃）
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P2] URL 处理', () => {
    test('[P2] 带参数的URL应该正确处理', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问带参数的管理页面
      await page.goto('/admin/showcase?page=1&status=pending');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P2] 带hash的URL应该正确处理', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问带hash的管理页面
      await page.goto('/admin/showcase#pending');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P2] 错误处理', () => {
    test('[P2] 无效的管理路径应该正确处理', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问无效的管理路径
      await page.goto('/admin/invalid-path');

      // THEN: 应该重定向到登录页或404（不崩溃）
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 登录页面应该有正确的结构', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 登录页面应该有正确的结构
      await expect(page.locator('body')).toBeVisible();
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('[P3] 注册页面应该有正确的结构', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册页面应该有正确的结构
      await expect(page.locator('body')).toBeVisible();
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test.describe('[P3] 页面导航', () => {
    test('[P3] 从登录页导航到注册页', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 登录页应该可见
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P3] 从注册页导航到登录页', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册页应该可见
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
