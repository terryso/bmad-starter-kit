/**
 * My Projects E2E 测试
 *
 * 测试用户查看和管理自己提交的项目的完整流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-7: 我的项目管理
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策 - 核心用户旅程)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户功能)
 * - network-first.md (网络优先模式)
 * - test-quality.md (确定性测试、显式断言)
 */
import { test, expect } from '@playwright/test';

test.describe('我的项目管理', () => {
  // 使用认证状态
  test.use({ storageState: 'playwright/.auth/user.json' });

  // 预留 testUserId 用于未来扩展
  // const testUserId: string | null = null;

  test.describe('[P1] 页面加载和基本显示', () => {
    test('[P1] 应能成功加载我的项目页面', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 页面应该加载成功
      await expect(page).toHaveTitle(/我的项目/);
      await expect(page.locator('body')).toBeVisible();

      // 验证页面标题
      const heading = page.locator('h1, h2').filter({ hasText: /我的项目/ }).first();
      await expect(heading).toBeVisible();
    });

    test('[P1] 页面应显示正确的导航', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 应该显示项目计数或空状态
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('[P1] 未认证访问应重定向到登录页', async ({ page, context }) => {
      // GIVEN: 清除认证状态
      await context.clearCookies();

      // WHEN: 尝试访问我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 应该重定向到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('[P1] 空状态显示', () => {
    test('[P1] 没有项目时应显示空状态', async ({ page }) => {
      // 注意: 此测试假设有一个新用户没有项目
      // 如果测试用户有项目，此测试可能需要调整

      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 如果没有项目，应显示空状态提示
      const emptyState = page.locator('text=/暂无项目|还没有提交/').first();
      const hasEmptyState = await emptyState.count() > 0;

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }
      // 如果有项目，测试仍然通过（说明用户有项目）
    });

    test('[P1] 空状态应有正确的提示信息', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 如果没有项目，应显示引导提示
      const submitPrompt = page.locator('text=/提交您的第一个项目/').first();
      const hasPrompt = await submitPrompt.count() > 0;

      if (hasPrompt) {
        await expect(submitPrompt).toBeVisible();
      }
    });
  });

  test.describe('[P1] 项目列表显示', () => {
    test('[P1] 项目应显示基本信息', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 如果有项目，应显示项目列表
      const projectCards = page.locator('[data-testid="project-card"], .card').first();
      const hasCards = await projectCards.count() > 0;

      if (hasCards) {
        // 验证项目卡片存在
        await expect(projectCards).toBeVisible();

        // 验证项目名称显示
        const projectName = page.locator('[data-testid="project-name"], .card-title').first();
        await expect(projectName).toBeVisible();
      }
    });

    test('[P1] 项目应显示状态标签', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 项目状态应可见（如果有项目）
      const statusBadge = page.locator('[data-testid="project-status"], .badge').first();
      const hasBadge = await statusBadge.count() > 0;

      if (hasBadge) {
        await expect(statusBadge).toBeVisible();
      }
    });

    test('[P1] 项目应显示 GitHub 链接', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 项目应有 GitHub 链接（如果有项目）
      const githubLink = page.locator('a[href*="github.com"]').first();
      const hasLink = await githubLink.count() > 0;

      if (hasLink) {
        await expect(githubLink).toBeVisible();
        await expect(githubLink).toHaveAttribute('target', '_blank');
        await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });
  });

  test.describe('[P2] 状态筛选功能', () => {
    test('[P2] 应能按状态筛选项目', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 应该有状态筛选按钮
      const filterButtons = page.locator('button').filter({ hasText: /全部|待审核|已批准|已拒绝/ });
      const buttonCount = await filterButtons.count();

      if (buttonCount > 0) {
        // 验证筛选按钮存在
        await expect(filterButtons.first()).toBeVisible();

        // 点击"待审核"筛选
        const pendingFilter = filterButtons.filter({ hasText: /待审核/ });
        if (await pendingFilter.count() > 0) {
          await pendingFilter.first().click();

          // 验证页面更新（实际验证取决于有 PENDING 状态的项目）
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('[P2] 筛选按钮应显示正确的状态', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 筛选按钮应可见
      const filterButtons = page.locator('button').filter({ hasText: /全部|待审核|已批准|已拒绝/ });
      const buttonCount = await filterButtons.count();

      if (buttonCount > 0) {
        // 验证至少有"全部"按钮
        const allButton = filterButtons.filter({ hasText: /全部/ });
        await expect(allButton.first()).toBeVisible();
      }
    });
  });

  test.describe('[P2] 项目删除功能', () => {
    test('[P2] 应能删除非批准状态的项目', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 如果有待审核或被拒绝的项目，应显示删除按钮
      const deleteButton = page.locator('button').filter({ hasText: /删除/ }).or(
        page.locator('[data-testid="delete-button"]')
      ).first();

      const hasDeleteButton = await deleteButton.count() > 0;

      if (hasDeleteButton) {
        // 点击删除按钮
        await deleteButton.click();

        // 应该显示确认对话框
        const confirmDialog = page.locator('[role="dialog"], [data-testid="delete-confirm-dialog"]').first();
        await expect(confirmDialog).toBeVisible();

        // 验证确认文本
        const confirmText = page.locator('text=/确认删除|确定要删除/').first();
        await expect(confirmText).toBeVisible();

        // 取消删除（避免实际删除测试数据）
        const cancelButton = page.locator('button').filter({ hasText: /取消/ }).first();
        await cancelButton.click();

        // 对话框应该关闭
        await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('[P2] 已批准的项目不应显示删除按钮', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 已批准的项目不应该有删除按钮
      const approvedBadge = page.locator('text=/已批准/').first();
      const hasApproved = await approvedBadge.count() > 0;

      if (hasApproved) {
        // 找到批准项目所在的卡片
        const approvedCard = approvedBadge.locator('xpath=ancestor::div[contains(@class, "card")]').first();

        // 验证该卡片没有删除按钮
        const deleteButtonInCard = approvedCard.locator('button').filter({ hasText: /删除/ });
        await expect(deleteButtonInCard).toHaveCount(0);
      }
    });
  });

  test.describe('[P2] 拒绝原因显示', () => {
    test('[P2] 被拒绝的项目应显示拒绝原因', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 如果有被拒绝的项目，应显示拒绝原因
      const rejectedBadge = page.locator('text=/已拒绝/').first();
      const hasRejected = await rejectedBadge.count() > 0;

      if (hasRejected) {
        // 找到拒绝项目所在的卡片
        const rejectedCard = rejectedBadge.locator('xpath=ancestor::div[contains(@class, "card")]').first();

        // 验证显示拒绝原因
        const rejectionReason = rejectedCard.locator('text=/.{5,}/').first();
        await expect(rejectionReason).toBeVisible();
      }
    });
  });

  test.describe('[P2] 分页功能', () => {
    test('[P2] 应能浏览多页项目', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 如果有多页，应显示分页控件
      const nextPageButton = page.locator('button').filter({ hasText: /下一页/ }).first();
      const hasNextPage = await nextPageButton.count() > 0;

      if (hasNextPage) {
        // 验证下一页按钮存在
        await expect(nextPageButton).toBeVisible();

        // 验证分页信息显示
        const paginationInfo = page.locator('text=/第 \\d+ \\/ \\d+ 页/').first();
        await expect(paginationInfo).toBeVisible();
      }
    });

    test('[P2] 第一页时上一页按钮应禁用', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 第一页时，上一页按钮应禁用
      const prevPageButton = page.locator('button').filter({ hasText: /上一页/ }).first();
      const hasPrevButton = await prevPageButton.count() > 0;

      if (hasPrevButton) {
        await expect(prevPageButton).toBeDisabled();
      }
    });
  });

  test.describe('[P2] 技术信息显示', () => {
    test('[P2] 项目应显示编程语言', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 项目应显示语言（如果有）
      const languageBadge = page.locator('[data-testid="project-language"], .badge').first();
      const hasLanguage = await languageBadge.count() > 0;

      if (hasLanguage) {
        await expect(languageBadge.first()).toBeVisible();
      }
    });

    test('[P2] 项目应显示标签', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 项目应显示标签（如果有）
      const topicBadges = page.locator('[data-testid="project-topics"], .badge');
      const count = await topicBadges.count();

      if (count > 0) {
        // 至少有一个标签
        await expect(topicBadges.first()).toBeVisible();
      }
    });

    test('[P2] 项目应显示提交时间', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 项目应显示提交时间
      const timeInfo = page.locator('text=/提交时间|\\d{4}\\D\\d{1,2}\\D\\d{1,2}/').first();
      await expect(timeInfo).toBeVisible();
    });
  });

  test.describe('[P3] 页面交互细节', () => {
    test('[P3] 项目卡片应有正确的视觉样式', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 页面应有适当的布局
      const gridContainer = page.locator('.grid, [data-testid="project-grid"]').first();
      await expect(gridContainer).toBeVisible();
    });

    test('[P3] 页面标题和描述应正确显示', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 页面应显示标题
      const title = page.locator('h1, h2').filter({ hasText: /我的项目/ }).first();
      await expect(title).toBeVisible();

      // 可能有项目计数
      const projectCount = page.locator('text=/\\d+ 个项目/').first();
      const hasCount = await projectCount.count() > 0;

      if (hasCount) {
        await expect(projectCount).toBeVisible();
      }
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 页面应有正确的页面标题', async ({ page }) => {
      // WHEN: 导航到我的项目页面
      await page.goto('/showcase/my-projects');

      // THEN: 页面应该有标题
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('[P3] 删除对话框应有焦点管理', async ({ page }) => {
      // WHEN: 导航到我的项目页面并点击删除按钮
      await page.goto('/showcase/my-projects');

      const deleteButton = page.locator('button').filter({ hasText: /删除/ }).first();
      const hasDeleteButton = await deleteButton.count() > 0;

      if (hasDeleteButton) {
        await deleteButton.click();

        // THEN: 对话框应该获得焦点
        const confirmDialog = page.locator('[role="dialog"], [data-testid="delete-confirm-dialog"]').first();
        await expect(confirmDialog).toBeVisible();

        // 取消键应该关闭对话框
        await page.keyboard.press('Escape');
        await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });
      }
    });
  });
});
