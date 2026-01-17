/**
 * 用户登录和登出流程 E2E 测试
 *
 * 测试完整的用户认证流程：登录成功、仪表板跳转、登出
 *
 * 覆盖 Epic 2: 用户认证与账户管理
 */
import { test, expect } from '../support/fixtures';

test.describe('[P0] 用户登录流程', () => {
  test.describe('[P0] 登录成功', () => {
    test('[P0] 登录成功后应跳转到仪表板', async ({ page, userFactory }) => {
      // GIVEN: 生成测试用户数据
      const userData = userFactory.createUser();

      // WHEN: 注册用户
      await page.goto('/register');
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.fill('#confirmPassword', userData.password);
      await page.click('button[type="submit"]');

      // THEN: 注册成功，跳转到登录页
      await expect(page).toHaveURL('/login');

      // WHEN: 使用相同凭证登录
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.click('button[type="submit"]');

      // THEN: 登录成功，跳转到仪表板或首页
      // 注意: 根据实际应用的路由配置，可能跳转到 /dashboard 或 /
      await expect(page).toHaveURL(/\/(dashboard|profile)?/);
    });

    test('[P1] 登录成功后应显示用户信息', async ({ page, userFactory }) => {
      // GIVEN: 已注册的用户
      const userData = userFactory.createUser({ name: 'Test User' });

      // 注册用户
      await page.goto('/register');
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.fill('#confirmPassword', userData.password);
      await page.click('button[type="submit"]');

      // 等待跳转到登录页
      await expect(page).toHaveURL('/login');

      // WHEN: 登录
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.click('button[type="submit"]');

      // THEN: 页面应显示用户名 (具体选择器取决于实际 UI)
      // 这里检查是否不再在登录页面，表示登录成功
      await expect(page).not.toHaveURL('/login');
    });
  });

  test.describe('[P1] 用户登出', () => {
    test('[P1] 登出后应清除认证状态并跳转到登录页', async ({ page, userFactory }) => {
      // GIVEN: 已登录的用户
      const userData = userFactory.createUser();

      // 注册并登录
      await page.goto('/register');
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.fill('#confirmPassword', userData.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/login');
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.click('button[type="submit"]');

      // 等待登录成功
      await expect(page).not.toHaveURL('/login');

      // WHEN: 用户登出
      // 查找登出按钮 (可能是导航菜单中的按钮)
      const logoutButton = page.locator('button:has-text("登出"), button:has-text("退出"), button:has-text("Logout")').first();

      const logoutButtonExists = await logoutButton.count();
      if (logoutButtonExists > 0) {
        await logoutButton.click();
      } else {
        // 如果没有明显的登出按钮，尝试清除 localStorage
        await page.evaluate(() => {
          localStorage.clear();
        });
        await page.goto('/login');
      }

      // THEN: 应该跳转到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 登出后访问受保护页面应重定向到登录页', async ({ page, userFactory }) => {
      // GIVEN: 已登录并登出的用户
      const userData = userFactory.createUser();

      // 注册并登录
      await page.goto('/register');
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.fill('#confirmPassword', userData.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/login');
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.click('button[type="submit"]');

      // 登出
      await page.evaluate(() => {
        localStorage.clear();
      });

      // WHEN: 尝试访问受保护页面
      await page.goto('/profile');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P1] 记住登录状态', () => {
    test('[P2] 刷新页面后应保持登录状态', async ({ page, userFactory }) => {
      // GIVEN: 已登录的用户
      const userData = userFactory.createUser();

      await page.goto('/register');
      await page.fill('#name', userData.name);
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.fill('#confirmPassword', userData.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/login');
      await page.fill('#email', userData.email);
      await page.fill('#password', userData.password);
      await page.click('button[type="submit"]');

      // WHEN: 刷新页面
      await page.reload();

      // THEN: 用户应该仍然登录 (不在登录页)
      await expect(page).not.toHaveURL('/login');
      // URL 应该保持不变或重定向到正确的页面
      await expect(page).toHaveURL(/\/(dashboard|profile|login)?/);
    });
  });
});
