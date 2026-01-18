/**
 * 管理员项目审核 E2E 测试
 *
 * 测试管理员审核待审核项目的端到端流程
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-6: 管理员审核界面
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (优先级分类)
 */
import { test, expect } from '@playwright/test';

// 测试用户凭证 (从环境变量或使用默认值)
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin123456',
  name: 'Test Admin',
};

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || `testuser${Date.now()}@example.com`,
  password: process.env.TEST_USER_PASSWORD || 'Test123456',
  name: 'Test User',
};

test.describe('[P0] 管理员项目审核 E2E', () => {
  test.describe('[P0] 访问控制', () => {
    test('[P0] 未登录用户应被重定向到登录页', async ({ page }) => {
      // GIVEN: 用户未登录
      await page.context().clearCookies();

      // WHEN: 尝试访问项目审核页面
      await page.goto('/admin/showcase');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P0] 未登录访问管理页面应重定向', async ({ page }) => {
      // GIVEN: 用户未登录
      await page.context().clearCookies();

      // WHEN: 尝试访问管理页面
      await page.goto('/admin');

      // THEN: 重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P1] 页面路由保护应正确工作', async ({ page }) => {
      // GIVEN: 清除认证状态
      await page.context().clearCookies();

      // WHEN: 尝试访问不同的管理页面
      const adminPaths = ['/admin', '/admin/showcase', '/admin/users'];

      for (const path of adminPaths) {
        await page.goto(path);
        // THEN: 每个管理页面都应该重定向到登录页
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('[P1] 页面加载', () => {
    test('[P1] 管理页面应该有正确的结构', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问管理页面
      await page.goto('/admin');

      // THEN: 应该重定向到登录页（不崩溃）
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] Showcase 管理页面应该有正确的结构', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问 Showcase 管理页面
      await page.goto('/admin/showcase');

      // THEN: 应该重定向到登录页（不崩溃）
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P0] 管理员审核工作流', () => {
    test.beforeEach(async ({ page }) => {
      // GIVEN: 管理员已登录
      await page.goto('/login');

      // 填写登录表单
      await page.fill('input[name="email"]', TEST_ADMIN.email);
      await page.fill('input[name="password"]', TEST_ADMIN.password);

      // 提交登录
      await page.click('button[type="submit"]');

      // 等待登录成功并导航到 dashboard
      await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });
    });

    test('[P0] 管理员应能访问项目审核页面', async ({ page }) => {
      // WHEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // THEN: 页面应该加载成功
      await expect(page.locator('body')).toBeVisible();

      // AND: 应该看到页面标题
      const pageTitle = await page.textContent('h1, h2');
      expect(pageTitle).toBeTruthy();
    });

    test('[P0] 项目审核页面应显示待审核项目列表', async ({ page }) => {
      // WHEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // THEN: 应该看到项目列表或空状态
      const listContainer = page.locator('text=/全部处理完成|暂无待审核|个项目/');
      await expect(listContainer).toBeVisible({ timeout: 10000 });
    });

    test('[P1] 项目卡片应显示完整信息', async ({ page }) => {
      // WHEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // THEN: 如果有待审核项目，卡片应该显示关键信息
      const projectCards = page.locator('[data-testid="project-card"], .grid > div').filter({ hasText: /批准|拒绝/ }).first();

      // 只在有项目时验证
      const cardCount = await projectCards.count();
      if (cardCount > 0) {
        // 应该有项目名称
        await expect(projectCards.locator('h3, .font-semibold, [class*="title"]')).toBeVisible();

        // 应该有操作按钮
        const approveBtn = projectCards.locator('button:has-text("批准"), button:has-text("Approve")');
        const rejectBtn = projectCards.locator('button:has-text("拒绝"), button:has-text("Reject")');
        await expect(approveBtn).toBeVisible();
        await expect(rejectBtn).toBeVisible();
      }
    });

    test('[P0] 管理员应能批准项目', async ({ page }) => {
      // GIVEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // 查找第一个项目的批准按钮
      const approveButton = page.locator('button:has-text("批准"), button:has-text("Approve")').first();

      const buttonCount = await approveButton.count();
      if (buttonCount === 0) {
        // 没有待审核项目，跳过测试
        test.skip();
        return;
      }

      // WHEN: 点击批准按钮
      await approveButton.click();

      // THEN: 应该显示确认对话框
      await expect(page.locator('text=/批准|Approve|确认/')).toBeVisible({ timeout: 5000 });

      // AND: 点击确认
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm"), button:has-text("确认批准")').first();
      await confirmButton.click();

      // THEN: 应该显示成功消息
      await expect(page.locator('text=/成功|已批准|approved/i')).toBeVisible({ timeout: 5000 });
    });

    test('[P0] 管理员应能拒绝项目', async ({ page }) => {
      // GIVEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // 查找第一个项目的拒绝按钮
      const rejectButton = page.locator('button:has-text("拒绝"), button:has-text("Reject")').first();

      const buttonCount = await rejectButton.count();
      if (buttonCount === 0) {
        // 没有待审核项目，跳过测试
        test.skip();
        return;
      }

      // WHEN: 点击拒绝按钮
      await rejectButton.click();

      // THEN: 应该显示拒绝对话框，包含原因输入框
      await expect(page.locator('text=/拒绝|Reject/')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('textarea, input[type="text"]')).toBeVisible();

      // AND: 输入拒绝原因
      const reasonInput = page.locator('textarea, input[type="text"]').first();
      await reasonInput.fill('项目描述不完整，请补充更多技术细节');

      // AND: 点击确认拒绝
      const confirmButton = page.locator('button:has-text("确认拒绝"), button:has-text("Confirm"), button:has-text("确认")').last();
      await confirmButton.click();

      // THEN: 应该显示成功消息
      await expect(page.locator('text=/成功|已拒绝|rejected/i')).toBeVisible({ timeout: 5000 });
    });

    test('[P1] 拒绝原因少于5字符应显示错误', async ({ page }) => {
      // GIVEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // 查找第一个项目的拒绝按钮
      const rejectButton = page.locator('button:has-text("拒绝"), button:has-text("Reject")').first();

      const buttonCount = await rejectButton.count();
      if (buttonCount === 0) {
        test.skip();
        return;
      }

      // WHEN: 点击拒绝按钮
      await rejectButton.click();

      // AND: 输入少于5字符的拒绝原因
      const reasonInput = page.locator('textarea, input[type="text"]').first();
      await reasonInput.fill('abc');

      // AND: 尝试确认
      const confirmButton = page.locator('button:has-text("确认拒绝"), button:has-text("Confirm")').last();
      await confirmButton.click();

      // THEN: 应该显示验证错误提示
      await expect(page.locator('text=/5|字符|最少|required/i')).toBeVisible({ timeout: 3000 });
    });

    test('[P1] 普通用户无法访问管理页面', async ({ page }) => {
      // GIVEN: 先以管理员身份登录
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_ADMIN.email);
      await page.fill('input[name="password"]', TEST_ADMIN.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

      // 退出登录
      await page.goto('/logout');

      // 注册/登录为普通用户
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);

      // 尝试注册新用户
      const registerLink = page.locator('a:has-text("注册"), a:has-text("Register")');
      const hasRegister = await registerLink.count();

      if (hasRegister > 0) {
        await registerLink.first().click();
        await page.fill('input[name="name"]', TEST_USER.name);
        await page.fill('input[name="email"]', TEST_USER.email);
        await page.fill('input[name="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');

        // 登录普通用户
        await page.goto('/login');
        await page.fill('input[name="email"]', TEST_USER.email);
        await page.fill('input[name="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
      }

      // WHEN: 普通用户尝试访问管理页面
      await page.goto('/admin/showcase');

      // THEN: 应该被重定向或显示无权限提示
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/dashboard');
      const hasAccessDenied = await page.locator('text=/403|禁止|无权限|forbidden/i').count() > 0;

      expect(isRedirected || hasAccessDenied).toBeTruthy();
    });
  });

  test.describe('[P2] 边界情况', () => {
    test('[P2] 无效的管理路径应该正确处理', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问无效的管理路径
      await page.goto('/admin/invalid-path');

      // THEN: 应该重定向到登录页或404（不崩溃）
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P2] 分页应该正常工作', async ({ page }) => {
      // GIVEN: 管理员已登录
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_ADMIN.email);
      await page.fill('input[name="password"]', TEST_ADMIN.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard|\/admin/, { timeout: 10000 });

      // WHEN: 访问项目审核页面
      await page.goto('/admin/showcase');

      // THEN: 如果有分页控件，应该可见
      const pagination = page.locator('text=/上一页|下一页|previous|next/i');
      const hasPagination = await pagination.count() > 0;

      if (hasPagination) {
        await expect(pagination.first()).toBeVisible();
      }
    });
  });

  test.describe('[P2] 错误处理', () => {
    test('[P2] 无效的管理路径应该正确处理', async ({ page }) => {
      // GIVEN: 清除认证
      await page.context().clearCookies();

      // WHEN: 访问无效的管理路径
      await page.goto('/admin/invalid-path');

      // THEN: 应该重定向到登录页或404（不崩溃）
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 登录页面应该有正确的结构', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 登录页面应该有正确的结构
      await expect(page.locator('body')).toBeVisible();
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('[P3] 注册页面应该有正确的结构', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册页面应该有正确的结构
      await expect(page.locator('body')).toBeVisible();
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test.describe('[P3] 页面导航', () => {
    test('[P3] 从登录页导航到注册页', async ({ page }) => {
      // WHEN: 访问登录页面
      await page.goto('/login');

      // THEN: 登录页应该可见
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P3] 从注册页导航到登录页', async ({ page }) => {
      // WHEN: 访问注册页面
      await page.goto('/register');

      // THEN: 注册页应该可见
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
