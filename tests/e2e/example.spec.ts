/**
 * 示例测试套件
 *
 * 演示 Playwright 测试的最佳实践:
 * - Given-When-Then 结构
 * - 使用 data-testid 选择器
 * - 原子化测试 (每个测试一个断言)
 * - 无硬编码等待时间
 *
 * 知识库参考: testarch/knowledge/test-quality.md
 */
import { test, expect } from '../support/fixtures';
import { selectors } from '../support/helpers/selectors';

test.describe('示例测试套件', () => {
  test.describe('页面加载', () => {
    test('[P0] 应该能加载首页', async ({ page }) => {
      // GIVEN: 用户访问首页
      await page.goto('/');

      // THEN: 页面标题可见
      await expect(page).toHaveTitle(/BMAD Starter Kit|首页/);
    });

    test('[P0] 应该有正确的元描述', async ({ page }) => {
      // GIVEN: 用户访问首页
      await page.goto('/');

      // WHEN: 检查元描述
      const description = await page.locator('meta[name="description"]').getAttribute('content');

      // THEN: 元描述存在
      expect(description).not.toBeNull();
    });
  });

  test.describe('用户认证', () => {
    test('[P0] 应该显示登录表单', async ({ page }) => {
      // GIVEN: 用户访问登录页面
      await page.goto('/login');

      // THEN: 登录表单元素可见
      await expect(page.locator(selectors.auth.emailInput)).toBeVisible();
      await expect(page.locator(selectors.auth.passwordInput)).toBeVisible();
      await expect(page.locator(selectors.auth.loginButton)).toBeVisible();
    });

    test('[P1] 登录按钮在输入为空时应禁用', async ({ page }) => {
      // GIVEN: 用户访问登录页面
      await page.goto('/login');

      // WHEN: 表单为空时检查登录按钮
      const loginButton = page.locator(selectors.auth.loginButton);

      // THEN: 登录按钮应禁用
      await expect(loginButton).toBeDisabled();
    });

    test('[P2] 应该显示注册链接', async ({ page }) => {
      // GIVEN: 用户访问登录页面
      await page.goto('/login');

      // THEN: 注册链接可见
      await expect(page.locator(selectors.auth.registerLink)).toBeVisible();
    });
  });

  test.describe('数据工厂使用示例', () => {
    test('[P1] 应该生成随机用户数据', async ({ userFactory }) => {
      // GIVEN: 使用数据工厂创建用户
      const user = userFactory.createUser();

      // THEN: 用户数据有效
      expect(user.email).toContain('@');
      expect(user.email).toBe(user.email.toLowerCase());
      expect(user.password).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(user.role).toBe('user');
    });

    test('[P1] 应该支持数据覆盖', async ({ userFactory }) => {
      // GIVEN: 使用自定义数据创建用户
      const user = userFactory.createUser({
        email: 'custom@example.com',
        role: 'admin',
      });

      // THEN: 自定义数据生效
      expect(user.email).toBe('custom@example.com');
      expect(user.role).toBe('admin');
    });

    test('[P1] 应该创建多个用户', async ({ userFactory }) => {
      // GIVEN: 创建多个用户
      const users = userFactory.createUsers(5);

      // THEN: 所有用户都有唯一邮箱
      const emails = users.map((u) => u.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(5);
    });
  });

  test.describe('网络请求示例', () => {
    test('[P1] 应该拦截 API 请求', async ({ page }) => {
      // GIVEN: 设置 API 拦截
      const apiResponse = page.waitForResponse(
        (response) => response.url().includes('/api/') && response.status() === 200,
      );

      // WHEN: 导航到需要 API 的页面
      await page.goto('/dashboard');

      // THEN: API 请求成功
      const response = await apiResponse;
      expect(response.status()).toBe(200);
    });

    test('[P1] 应该模拟 API 响应', async ({ page }) => {
      // GIVEN: 模拟 API 响应
      await page.route('**/api/user', (route) =>
        route.fulfill({
          status: 200,
          body: JSON.stringify({ id: '1', name: '测试用户', email: 'test@example.com' }),
        }),
      );

      // WHEN: 访问用户页面
      await page.goto('/profile');

      // THEN: 显示模拟的用户数据
      await expect(page.locator(selectors.user.userName)).toHaveText('测试用户');
    });
  });
});
