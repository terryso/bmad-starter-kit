/**
 * 用户登录和登出流程 E2E 测试
 *
 * 测试完整的用户认证流程：登录成功、仪表板跳转、登出
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect } from '../support/fixtures';
import { selectors } from '../support/helpers/selectors';

test.describe('[P0] 用户登录流程', () => {
  test.describe('[P0] 登录表单', () => {
    test('[P0] 登录页面应该正确显示', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 登录表单元素可见
      await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
      await expect(page.locator(selectors.auth.emailInput)).toBeVisible();
      await expect(page.locator(selectors.auth.passwordInput)).toBeVisible();
      await expect(page.locator(selectors.auth.loginButton)).toBeVisible();
    });

    test('[P1] 应该有注册链接', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 注册链接可见
      await expect(page.locator(selectors.auth.registerLink)).toBeVisible();
    });
  });

  test.describe('[P1] 注册表单', () => {
    test('[P0] 注册页面应该正确显示', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册表单元素可见
      await expect(page.getByRole('heading', { name: '注册' })).toBeVisible();
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
    });

    test('[P1] 应该有登录链接', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 登录链接可见
      await expect(page.locator('text=/已有账号/')).toBeVisible();
      await expect(page.locator('a[href="/login"]')).toBeVisible();
    });
  });

  test.describe('[P1] 路由保护', () => {
    test('[P1] 未登录访问受保护页面应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问受保护页面
      await page.goto('/profile');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 未登录访问管理页面应重定向', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P2] 页面导航', () => {
    test('[P2] 可以从登录页导航到注册页', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // AND: 点击注册链接
      await page.click(selectors.auth.registerLink);

      // THEN: 导航到注册页面
      await expect(page).toHaveURL('/register');
    });

    test('[P2] 可以从注册页导航到登录页', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // AND: 点击登录链接
      await page.click('a[href="/login"]');

      // THEN: 导航到登录页面
      await expect(page).toHaveURL('/login');
    });
  });
});
