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
    test('[P0] 应该能加载登录页', async ({ page }) => {
      // GIVEN: 用户访问登录页
      await page.goto('/login');

      // THEN: 页面标题可见
      await expect(page).toHaveTitle(/管理平台/);
    });

    test('[P0] 应该有正确的元描述', async ({ page }) => {
      // GIVEN: 用户访问登录页
      await page.goto('/login');

      // WHEN: 检查元描述
      const description = await page.locator('meta[name="description"]').getAttribute('content');

      // THEN: 元描述存在
      expect(description).toContain('BMAD Starter Kit');
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

    test('[P1] 登录按钮在输入为空时应启用', async ({ page }) => {
      // GIVEN: 用户访问登录页面
      await page.goto('/login');

      // WHEN: 表单为空时检查登录按钮
      const loginButton = page.locator(selectors.auth.loginButton);

      // THEN: 登录按钮应启用（因为没有required验证在前端阻止）
      await expect(loginButton).toBeEnabled();
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
    test('[P1] 应能访问公开页面', async ({ page }) => {
      // GIVEN: 访问项目展示页面
      await page.goto('/showcase');

      // THEN: 页面加载成功
      await expect(page).toHaveTitle(/管理平台/);
    });

    test('[P1] 受保护页面需要登录', async ({ page }) => {
      // WHEN: 未登录访问受保护页面
      const response = await page.goto('/profile');

      // THEN: 应该被重定向到登录页
      // 注意：实际行为取决于 AuthProvider 的实现
      // 如果使用 AuthProvider 重定向，最终URL应该包含/login
      expect(page.url()).toMatch(/\/login/);
    });
  });
});
