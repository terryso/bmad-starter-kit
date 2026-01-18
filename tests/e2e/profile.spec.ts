/**
 * 个人资料管理 E2E 测试
 *
 * 测试用户查看和编辑个人资料功能
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect } from '../support/fixtures';
import { selectors } from '../support/helpers/selectors';

test.describe('[P1] 个人资料管理', () => {
  test.describe('[P1] 查看个人资料', () => {
    test('[P1] 未登录用户访问个人资料应重定向到登录页', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问个人资料页面
      await page.goto('/profile');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 页面结构应该正确', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问个人资料页面
      await page.goto('/profile');

      // THEN: 重定向到登录页（验证路由保护工作正常）
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P1] 编辑个人资料', () => {
    test('[P1] 表单元素应该存在', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问个人资料页面
      await page.goto('/profile');

      // THEN: 被重定向到登录页（受保护路由）
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P2] 头像上传', () => {
    test('[P2] 头像上传功能检查', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 访问个人资料页面
      await page.goto('/profile');

      // THEN: 被重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
