/**
 * 用户认证 E2E 测试
 *
 * 测试用户注册、登录、登出和路由保护功能
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect } from '../support/fixtures';
import { selectors } from '../support/helpers/selectors';

test.describe('用户认证', () => {
  test.describe('[P0] 用户注册', () => {
    test('[P0] 注册表单应该正确显示', async ({ page, userFactory }) => {
      // GIVEN: 生成测试用户数据
      const userData = userFactory.createUser();

      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册表单可见
      await expect(page.getByRole('heading', { name: '注册' })).toBeVisible();
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // WHEN: 填写注册表单
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.fill('#confirmPassword', userData.password);

      // THEN: 表单已填写
      await expect(page.locator('#name')).toHaveValue(userData.name);
      await expect(page.locator('#email')).toHaveValue(userData.email);
    });

    test('[P1] 应该显示密码长度验证错误', async ({ page }) => {
      // GIVEN: 访问注册页面
      await page.goto('/register');

      // WHEN: 输入过短密码
      await page.fill('#name', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', '123');
      await page.fill('#confirmPassword', '123');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示密码验证错误
      await expect(page.locator('.text-destructive')).toContainText('密码至少需要 8 位');
    });

    test('[P1] 应该显示密码不匹配错误', async ({ page }) => {
      // GIVEN: 访问注册页面
      await page.goto('/register');

      // WHEN: 输入不匹配的密码
      await page.fill('#name', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Password123');
      await page.fill('#confirmPassword', 'Different123');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示密码不匹配错误
      await expect(page.locator('.text-destructive')).toContainText('两次输入的密码不一致');
    });
  });

  test.describe('[P0] 用户登录', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('[P0] 登录表单应该正确显示', async ({ page }) => {
      // THEN: 所有表单元素可见
      await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
      await expect(page.locator(selectors.auth.emailInput)).toBeVisible();
      await expect(page.locator(selectors.auth.passwordInput)).toBeVisible();
      await expect(page.locator(selectors.auth.loginButton)).toBeVisible();
    });

    test('[P1] 应该有注册页链接', async ({ page }) => {
      // WHEN: 点击注册链接
      await page.click(selectors.auth.registerLink);

      // THEN: 导航到注册页面
      await expect(page).toHaveURL('/register');
    });

    test('[P1] 应该显示密码长度验证错误', async ({ page }) => {
      // WHEN: 输入有效邮箱和过短密码
      await page.fill(selectors.auth.emailInput, 'test@example.com');
      await page.fill(selectors.auth.passwordInput, '123');

      // AND: 触发验证
      await page.click(selectors.auth.loginButton);

      // THEN: 显示密码验证错误
      await expect(page.locator('.text-destructive')).toContainText('密码至少需要 8 位');
    });
  });

  test.describe('[P1] 路由保护', () => {
    test('[P1] 未登录用户访问受保护页面应重定向到登录页', async ({ page }) => {
      // GIVEN: 清除所有认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问受保护页面
      await page.goto('/profile');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 未登录用户访问管理页面应重定向到登录页', async ({ page }) => {
      // GIVEN: 清除所有认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问管理员页面
      await page.goto('/admin/users');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P2] UI 交互', () => {
    test('[P2] 提交时按钮应显示加载状态', async ({ page }) => {
      // GIVEN: 访问登录页面
      await page.goto('/login');

      // WHEN: 填写表单并拦截 API 请求延迟响应
      await page.fill(selectors.auth.emailInput, 'test@example.com');
      await page.fill(selectors.auth.passwordInput, 'Password123');

      // 模拟慢速网络
      await page.route('**/api/v1/auth/login', (route) => {
        setTimeout(() => route.continue(), 2000);
      });

      await page.click(selectors.auth.loginButton);

      // THEN: 按钮显示加载状态
      await expect(page.locator(selectors.auth.loginButton)).toContainText('登录中...');
      await expect(page.locator(selectors.auth.loginButton)).toBeDisabled();
    });
  });
});
