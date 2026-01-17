/**
 * 用户认证 E2E 测试
 *
 * 测试用户注册、登录、登出和路由保护功能
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect } from '../support/fixtures';

test.describe('用户认证', () => {
  test.describe('[P0] 用户注册', () => {
    test('[P0] 应该能成功注册新用户', async ({ page, userFactory }) => {
      // GIVEN: 生成测试用户数据
      const userData = userFactory.createUser();

      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册表单可见
      await expect(page.locator('h1')).toContainText('注册');

      // WHEN: 填写注册表单
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);

      // 填写确认密码
      await page.fill('#confirmPassword', userData.password);

      // AND: 提交表单
      await page.click('button[type="submit"]');

      // THEN: 注册成功，跳转到登录页
      await expect(page).toHaveURL('/login');
    });

    test('[P1] 应该显示邮箱格式验证错误', async ({ page }) => {
      // GIVEN: 访问注册页面
      await page.goto('/register');

      // WHEN: 输入无效邮箱
      await page.fill('#email', 'invalid-email');
      await page.fill('#password', 'Password123');
      await page.fill('#confirmPassword', 'Password123');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示邮箱验证错误
      await expect(page.locator('text=/请输入有效的邮箱地址/')).toBeVisible();
    });

    test('[P1] 应该显示密码长度验证错误', async ({ page }) => {
      // GIVEN: 访问注册页面
      await page.goto('/register');

      // WHEN: 输入过短密码
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', '123');
      await page.fill('#confirmPassword', '123');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示密码验证错误
      await expect(page.locator('text=/密码至少需要 8 位/')).toBeVisible();
    });

    test('[P1] 应该显示密码不匹配错误', async ({ page }) => {
      // GIVEN: 访问注册页面
      await page.goto('/register');

      // WHEN: 输入不匹配的密码
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Password123');
      await page.fill('#confirmPassword', 'Different123');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示密码不匹配错误
      await expect(page.locator('text=/两次输入的密码不一致/')).toBeVisible();
    });
  });

  test.describe('[P0] 用户登录', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('[P0] 登录表单应该正确显示', async ({ page }) => {
      // THEN: 所有表单元素可见
      await expect(page.locator('h1')).toContainText('登录');
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('[P1] 应该有注册页链接', async ({ page }) => {
      // WHEN: 点击注册链接
      await page.click('text=/去注册/');

      // THEN: 导航到注册页面
      await expect(page).toHaveURL('/register');
    });

    test('[P1] 应该显示邮箱格式验证错误', async ({ page }) => {
      // WHEN: 输入无效邮箱和任意密码
      await page.fill('#email', 'not-an-email');
      await page.fill('#password', 'somepassword');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示邮箱验证错误
      await expect(page.locator('text=/请输入有效的邮箱地址/')).toBeVisible();
    });

    test('[P1] 应该显示密码长度验证错误', async ({ page }) => {
      // WHEN: 输入有效邮箱和过短密码
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', '123');

      // AND: 触发验证
      await page.click('button[type="submit"]');

      // THEN: 显示密码验证错误
      await expect(page.locator('text=/密码至少需要 8 位/')).toBeVisible();
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
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Password123');

      // 模拟慢速网络
      await page.route('**/api/v1/auth/login', (route) => {
        setTimeout(() => route.continue(), 2000);
      });

      await page.click('button[type="submit"]');

      // THEN: 按钮显示加载状态
      await expect(page.locator('button[type="submit"]')).toContainText('登录中...');
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });
});
