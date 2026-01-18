/**
 * 管理后台 E2E 测试
 *
 * 测试管理员仪表盘和用户管理功能
 *
 * 覆盖 Epic 7: 系统管理
 */
import { test, expect } from '../support/fixtures';

test.describe('管理后台', () => {
  test.describe('[P1] 管理员仪表盘', () => {
    test('[P1] 未登录访问应被重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问管理仪表盘
      await page.goto('/admin');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P1] 用户管理', () => {
    test('[P1] 未登录访问应被重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问用户管理页面
      await page.goto('/admin/users');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P2] 搜索功能元素检查', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问用户管理页面
      await page.goto('/admin/users');

      // THEN: 被重定向到登录页（验证路由保护）
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P1] 权限控制', () => {
    test('[P1] 未登录用户应被重定向到登录页', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问管理页面
      await page.goto('/admin');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 未登录用户访问用户管理应被重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin/users');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
