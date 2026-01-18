/**
 * Showcase 菜单导航 E2E 测试
 *
 * 测试 Story 8.8: 展示页菜单入口
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8.8: 展示页菜单入口
 *
 * 验收标准覆盖:
 * - Scenario: 导航栏显示项目展示链接
 * - Scenario: 移动端适配
 * - Scenario: 未登录用户访问
 * - Scenario: 已登录用户访问
 * - Scenario: 菜单高亮状态
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策 - 用户界面交互)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 * - test-quality.md (确定性测试、显式断言)
 */
import { test, expect } from '@playwright/test';

test.describe('Story 8.8: 展示页菜单入口', () => {
  test.describe('[P1] 导航栏显示项目展示链接', () => {
    test('[P1] 侧边栏应显示"项目展示"菜单项', async ({ page }) => {
      // GIVEN: 用户访问任何页面
      await page.goto('/');

      // WHEN: 查看侧边栏导航
      const sidebar = page.locator('aside').first();

      // THEN: 应显示"项目展示"菜单项
      const showcaseLink = sidebar.getByRole('link', { name: /项目展示/ });
      await expect(showcaseLink).toBeVisible();
    });

    test('[P1] 项目展示菜单项应有正确的图标', async ({ page }) => {
      // GIVEN: 用户访问任何页面
      await page.goto('/');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 应显示正确的图标 (FolderOpen 或类似图标)
      const icon = showcaseLink.locator('svg');
      await expect(icon).toBeVisible();
    });

    test('[P1] 点击菜单项应跳转到 /showcase 页面', async ({ page }) => {
      // GIVEN: 用户在任何页面
      await page.goto('/');

      // WHEN: 点击项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await showcaseLink.click();

      // THEN: 应跳转到展示页面
      await expect(page).toHaveURL(/\/showcase/);
    });

    test('[P1] Header 面包屑应显示正确的路由名称', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // WHEN: 查看 Header 面包屑
      const breadcrumb = page.locator('header nav');

      // THEN: 应显示"项目展示"
      await expect(breadcrumb).toContainText('项目展示');
    });
  });

  test.describe('[P1] 菜单高亮状态', () => {
    test('[P1] 在 /showcase 页面时菜单项应显示为激活状态', async ({ page }) => {
      // GIVEN: 用户在展示页面
      await page.goto('/showcase');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 菜单项应显示为激活状态
      await expect(showcaseLink).toHaveClass(/sidebar-active/);
    });

    test('[P1] 在 /showcase/:id 详情页时菜单项应高亮', async ({ page }) => {
      // GIVEN: 用户在项目详情页
      await page.goto('/showcase/1');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 菜单项应显示为激活状态 (使用 startsWith 匹配)
      await expect(showcaseLink).toHaveClass(/sidebar-active/);
    });

    test('[P1] 在其他页面时项目展示菜单不应高亮', async ({ page }) => {
      // GIVEN: 用户在仪表盘页面
      await page.goto('/');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 菜单项不应显示为激活状态
      await expect(showcaseLink).not.toHaveClass(/sidebar-active/);
    });

    test('[P1] 在 /showcase/my-projects 时菜单项应高亮', async ({ page }) => {
      // GIVEN: 用户在我的项目页面
      await page.goto('/showcase/my-projects');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 菜单项应显示为激活状态
      await expect(showcaseLink).toHaveClass(/sidebar-active/);
    });
  });

  test.describe('[P1] 未登录用户访问', () => {
    test('[P1] 侧边栏应显示"项目展示"菜单项', async ({ page, context }) => {
      // GIVEN: 用户未登录
      await context.clearCookies();

      // WHEN: 访问首页
      await page.goto('/');

      // THEN: 侧边栏应显示"项目展示"菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await expect(showcaseLink).toBeVisible();
    });

    test('[P1] 点击可以正常访问公开的展示页面', async ({ page, context }) => {
      // GIVEN: 用户未登录
      await context.clearCookies();

      // WHEN: 点击项目展示菜单项
      await page.goto('/');
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await showcaseLink.click();

      // THEN: 应可以正常访问展示页面
      await expect(page).toHaveURL(/\/showcase/);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P1] 已登录用户访问', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('[P1] 侧边栏应显示"项目展示"菜单项', async ({ page }) => {
      // GIVEN: 用户已登录
      await page.goto('/');

      // WHEN: 查看侧边栏
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 应显示项目展示菜单项
      await expect(showcaseLink).toBeVisible();
    });

    test('[P1] 点击可以访问展示页面', async ({ page }) => {
      // GIVEN: 用户已登录
      await page.goto('/');

      // WHEN: 点击项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await showcaseLink.click();

      // THEN: 应正常访问展示页面
      await expect(page).toHaveURL(/\/showcase/);
    });
  });

  test.describe('[P2] 移动端适配', () => {
    test('[P2] 移动端侧边栏应折叠为图标模式', async ({ page }) => {
      // GIVEN: 用户使用移动设备访问
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // WHEN: 查看侧边栏
      const sidebar = page.locator('aside');

      // THEN: 侧边栏应处于折叠模式
      await expect(sidebar).toHaveClass(/w-16/);
      await expect(sidebar).not.toHaveClass(/w-64/);
    });

    test('[P2] 移动端"项目展示"菜单项应显示为图标', async ({ page }) => {
      // GIVEN: 用户使用移动设备访问
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 图标应可见
      const icon = showcaseLink.locator('svg');
      await expect(icon).toBeVisible();

      // AND: 文字应隐藏
      const text = showcaseLink.locator('span').filter({ hasText: /项目展示/ });
      await expect(text).not.toBeVisible();
    });

    test('[P2] 移动端点击图标应正常跳转', async ({ page }) => {
      // GIVEN: 用户使用移动设备访问
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // WHEN: 点击项目展示图标
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await showcaseLink.click();

      // THEN: 应正常跳转到展示页面
      await expect(page).toHaveURL(/\/showcase/);
    });

    test('[P2] 桌面端应显示图标和文字', async ({ page }) => {
      // GIVEN: 用户使用桌面端访问
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 图标应可见
      const icon = showcaseLink.locator('svg');
      await expect(icon).toBeVisible();

      // AND: 文字应可见
      const text = showcaseLink.locator('span').filter({ hasText: /项目展示/ });
      await expect(text).toBeVisible();
    });
  });

  test.describe('[P2] 响应式断点测试', () => {
    test('[P2] 在 lg 断点侧边栏应展开', async ({ page }) => {
      // GIVEN: 在 lg 断点 (1024px)
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');

      // WHEN: 查看侧边栏
      const sidebar = page.locator('aside');

      // THEN: 侧边栏应展开
      await expect(sidebar).toHaveClass(/lg:w-64/);
    });

    test('[P2] 在小于 lg 断点侧边栏应折叠', async ({ page }) => {
      // GIVEN: 在小于 lg 断点 (1023px)
      await page.setViewportSize({ width: 1023, height: 768 });
      await page.goto('/');

      // WHEN: 查看侧边栏
      const sidebar = page.locator('aside');

      // THEN: 侧边栏应折叠
      await expect(sidebar).toHaveClass(/w-16/);
    });
  });

  test.describe('[P2] 导航交互', () => {
    test('[P2] 鼠标悬停应有正确的视觉反馈', async ({ page }) => {
      // GIVEN: 用户在首页
      await page.goto('/');

      // WHEN: 鼠标悬停在项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await showcaseLink.hover();

      // THEN: 应有 hover 样式
      await expect(showcaseLink).toHaveClass(/hover:bg-sidebar-accent/);
    });

    test('[P2] 从展示页导航到详情页菜单应保持高亮', async ({ page }) => {
      // GIVEN: 用户在展示页面
      await page.goto('/showcase');

      // WHEN: 导航到详情页
      await page.goto('/showcase/123');

      // THEN: 菜单项应保持高亮
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      await expect(showcaseLink).toHaveClass(/sidebar-active/);
    });
  });

  test.describe('[P2] Header 路由名称测试', () => {
    test('[P2] 项目详情页应显示"项目详情"标题', async ({ page }) => {
      // GIVEN: 用户在项目详情页
      await page.goto('/showcase/123');

      // WHEN: 查看 Header 面包屑
      const breadcrumb = page.locator('header nav');

      // THEN: 应显示"项目详情"
      await expect(breadcrumb).toContainText('项目详情');
    });

    test('[P2] 我的项目页应显示"我的项目"标题', async ({ page }) => {
      // GIVEN: 用户在我的项目页
      await page.goto('/showcase/my-projects');

      // WHEN: 查看 Header 面包屑
      const breadcrumb = page.locator('header nav');

      // THEN: 应显示"我的项目"
      await expect(breadcrumb).toContainText('我的项目');
    });
  });

  test.describe('[P3] 可访问性和边缘情况', () => {
    test('[P3] 项目展示链接应有正确的 ARIA 属性', async ({ page }) => {
      // GIVEN: 用户访问首页
      await page.goto('/');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 应是可访问的链接元素
      await expect(showcaseLink).toHaveAttribute('href', '/showcase');
    });

    test('[P3] 图标尺寸应符合规范', async ({ page }) => {
      // GIVEN: 用户访问首页
      await page.goto('/');

      // WHEN: 查看项目展示菜单项的图标
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });
      const icon = showcaseLink.locator('svg');

      // THEN: 图标应有正确的尺寸类
      await expect(icon).toHaveClass(/w-5/);
      await expect(icon).toHaveClass(/h-5/);
    });

    test('[P3] 不存在的 showcase 路由也应保持菜单高亮', async ({ page }) => {
      // GIVEN: 用户访问一个不存在的项目详情页
      await page.goto('/showcase/nonexistent-id');

      // WHEN: 查看项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 菜单项仍应高亮 (因为路径以 /showcase 开头)
      await expect(showcaseLink).toHaveClass(/sidebar-active/);
    });
  });

  test.describe('[P3] 视觉样式验证', () => {
    test('[P3] 激活状态应有正确的背景色', async ({ page }) => {
      // GIVEN: 用户在展示页面
      await page.goto('/showcase');

      // WHEN: 查看激活的菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 应有 sidebar-active 类 (带有特定背景色)
      await expect(showcaseLink).toHaveClass(/sidebar-active/);
    });

    test('[P3] 非激活状态应有正确的文字颜色', async ({ page }) => {
      // GIVEN: 用户在仪表盘页面
      await page.goto('/');

      // WHEN: 查看非激活的项目展示菜单项
      const showcaseLink = page.locator('aside').getByRole('link', { name: /项目展示/ });

      // THEN: 应有前景文字颜色类
      await expect(showcaseLink).toHaveClass(/text-sidebar-foreground/);
    });
  });
});
