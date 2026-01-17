/**
 * Playwright 框架演示测试
 *
 * 这些测试不依赖应用服务器，仅用于验证测试框架配置正确
 */

import { test, expect } from '../support/fixtures';

test.describe('测试框架验证', () => {
  test('[P0] 应该能创建浏览器上下文', async ({ page }) => {
    // GIVEN: 创建新页面
    await page.goto('about:blank');

    // THEN: 页面可访问
    expect(await page.evaluate(() => document.title)).toBe('');
  });

  test('[P0] 应该支持基础交互', async ({ page }) => {
    // GIVEN: 创建带有内容的页面
    await page.setContent('<button data-testid="test-button">点击我</button>');

    // WHEN: 点击按钮
    await page.click('[data-testid="test-button"]');

    // THEN: 按钮仍然存在
    await expect(page.locator('[data-testid="test-button"]')).toBeVisible();
  });
});

test.describe('数据工厂验证', () => {
  test('[P0] UserFactory 应该生成有效用户数据', async ({ userFactory }) => {
    // GIVEN: 使用数据工厂
    const user = userFactory.createUser();

    // THEN: 用户数据有效
    expect(user.email).toContain('@');
    expect(user.email).toBe(user.email.toLowerCase());
    expect(user.password).toBeTruthy();
    expect(user.password.length).toBeGreaterThanOrEqual(8);
    expect(user.name).toBeTruthy();
    expect(user.role).toBe('user');
  });

  test('[P0] UserFactory 应该支持数据覆盖', async ({ userFactory }) => {
    // GIVEN: 使用自定义数据
    const user = userFactory.createUser({
      email: 'test@example.com',
      role: 'admin',
    });

    // THEN: 自定义数据生效
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('admin');
  });

  test('[P0] UserFactory 应该创建多个不同用户', async ({ userFactory }) => {
    // GIVEN: 创建多个用户
    const users = userFactory.createUsers(10);

    // THEN: 所有用户邮箱唯一
    const emails = users.map((u) => u.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(10);
  });
});
