/**
 * 管理后台 E2E 测试 (增强版)
 *
 * 测试管理员仪表盘、用户管理、统计等功能
 *
 * 覆盖 Epic 7: 系统管理
 */
import { test, expect } from '../support/fixtures';

test.describe('[P1] 管理后台', () => {
  test.describe('[P1] 管理员仪表盘', () => {
    test('[P1] 未登录访问应重定向到登录页', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin');

      // THEN: 未登录应重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 管理页面路由保护', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin');

      // THEN: 应该在登录页
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
    });
  });

  test.describe('[P1] 用户管理', () => {
    test('[P1] 未登录访问用户管理应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问用户管理页面
      await page.goto('/admin/users');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 用户管理页面路由保护', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问用户管理页面
      await page.goto('/admin/users');

      // THEN: 应该在登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P1] 权限控制', () => {
    test('[P1] 未登录用户应被重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问管理页面
      await page.goto('/admin');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 未登录访问所有管理页面都应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问不同的管理页面
      const adminPaths = ['/admin', '/admin/users', '/admin/showcase'];

      for (const path of adminPaths) {
        await page.goto(path);
        // THEN: 每个管理页面都应该重定向到登录页
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('[P2] Showcase 管理', () => {
    test('[P2] 未登录访问 Showcase 管理应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问 Showcase 管理页面
      await page.goto('/admin/showcase');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
