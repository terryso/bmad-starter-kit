/**
 * 删除我的项目功能 E2E 测试
 *
 * 测试"我的项目"页面的删除项目功能
 * 验证用户能够删除自己提交的待审核或已拒绝的项目
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-9: 项目信息管理
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-quality.md (测试质量标准)
 */

import { test, expect } from '@/tests/support/fixtures';

test.describe('[P1] 删除我的项目功能 E2E', () => {
  test.describe('[P1] 删除按钮显示', () => {
    test('[P1] 待审核项目应显示删除按钮', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      // AND: 有待审核的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      // WHEN: 查看我的项目列表
      // THEN: 待审核项目应有删除按钮
      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');
        await expect(deleteButton).toBeVisible();
      }
    });

    test('[P1] 已拒绝项目应显示删除按钮', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      // AND: 有已拒绝的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      // WHEN: 查看我的项目列表
      // THEN: 已拒绝项目应有删除按钮
      const rejectedProjects = page.locator('[data-testid="status-rejected"]');
      const rejectedCount = await rejectedProjects.count();

      if (rejectedCount > 0) {
        const firstRejected = rejectedProjects.first();
        const deleteButton = firstRejected.locator('[data-testid="delete-project-button"]');
        await expect(deleteButton).toBeVisible();
      }
    });

    test('[P2] 已批准的项目不应显示删除按钮', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      // AND: 有已批准的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      // WHEN: 查看我的项目列表
      // THEN: 已批准的项目不应有删除按钮
      const approvedProjects = page.locator('[data-testid="status-approved"]');
      const approvedCount = await approvedProjects.count();

      if (approvedCount > 0) {
        const firstApproved = approvedProjects.first();
        const deleteButton = firstApproved.locator('[data-testid="delete-project-button"]');
        await expect(deleteButton).not.toBeVisible();
      }
    });

    test('[P2] 空状态时不应显示删除按钮', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录但没有项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      // WHEN: 项目列表为空
      const emptyState = page.locator('[data-testid="empty-state"]');
      const isEmpty = await emptyState.count();

      if (isEmpty > 0) {
        // THEN: 不应显示任何删除按钮
        const deleteButton = page.locator('[data-testid="delete-project-button"]');
        await expect(deleteButton).not.toBeVisible();
      }
    });
  });

  test.describe('[P1] 删除确认对话框', () => {
    test('[P1] 点击删除按钮应显示确认对话框', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户有可删除的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');

        // WHEN: 点击删除按钮
        await deleteButton.click();

        // THEN: 应显示删除确认对话框
        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        await expect(confirmDialog).toBeVisible();
      }
    });

    test('[P1] 确认对话框应有确认和取消按钮', async ({ page, authenticatedUser }) => {
      // GIVEN: 删除确认对话框已显示
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');
        await deleteButton.click();

        // WHEN: 查看确认对话框
        // THEN: 应有确认和取消按钮
        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        const confirmButton = confirmDialog.locator('[data-testid="confirm-delete-button"]');
        const cancelButton = confirmDialog.locator('button').filter({ hasText: /取消|Cancel/ });

        await expect(confirmButton).toBeVisible();
        await expect(cancelButton).toBeVisible();
      }
    });

    test('[P1] 确认对话框应显示警告信息', async ({ page, authenticatedUser }) => {
      // GIVEN: 删除确认对话框已显示
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');
        await deleteButton.click();

        // WHEN: 查看确认对话框
        // THEN: 应显示删除警告信息
        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        await expect(confirmDialog).toContainText(/删除|delete/i);
      }
    });
  });

  test.describe('[P1] 删除操作', () => {
    test('[P1] 确认删除应移除项目', async ({ page, authenticatedUser, request }) => {
      // GIVEN: 用户有可删除的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        // 获取删除前的项目数量
        const projectItems = page.locator('[data-testid="my-project-item"]');
        const countBefore = await projectItems.count();

        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');

        // WHEN: 点击删除并确认
        await deleteButton.click();

        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        const confirmButton = confirmDialog.locator('[data-testid="confirm-delete-button"]');
        await confirmButton.click();

        // 等待删除完成
        await page.waitForTimeout(1000);

        // THEN: 项目应从列表中移除
        const countAfter = await projectItems.count();
        expect(countAfter).toBeLessThan(countBefore);
      }
    });

    test('[P1] 删除成功应显示成功提示', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户有可删除的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');

        // WHEN: 点击删除并确认
        await deleteButton.click();

        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        const confirmButton = confirmDialog.locator('[data-testid="confirm-delete-button"]');
        await confirmButton.click();

        // 等待响应
        await page.waitForTimeout(1000);

        // THEN: 应显示成功提示
        const toast = page.locator('[data-testid="toast"]').filter({
          hasText: /删除成功|deleted/i,
        });
        const toastExists = await toast.count();
        expect(toastExists).toBeGreaterThan(0);
      }
    });

    test('[P1] 取消删除应保留项目', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户有可删除的项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        // 获取删除前的项目数量
        const projectItems = page.locator('[data-testid="my-project-item"]');
        const countBefore = await projectItems.count();

        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');

        // WHEN: 点击删除但取消
        await deleteButton.click();

        // 点击取消按钮或按 ESC
        const cancelButton = page.locator('button').filter({ hasText: /取消|Cancel/ });
        const hasCancel = await cancelButton.count() > 0;

        if (hasCancel) {
          await cancelButton.first().click();
        } else {
          await page.keyboard.press('Escape');
        }

        // THEN: 项目应保留在列表中
        const countAfter = await projectItems.count();
        expect(countAfter).toBe(countBefore);
      }
    });
  });

  test.describe('[P2] 删除后导航', () => {
    test('[P2] 删除最后一个项目应显示空状态', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户只有一个项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const projectItems = page.locator('[data-testid="my-project-item"]');
      const itemCount = await projectItems.count();

      if (itemCount === 1) {
        const deleteButton = page.locator('[data-testid="delete-project-button"]');

        // WHEN: 删除唯一的项目
        await deleteButton.click();

        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        const confirmButton = confirmDialog.locator('[data-testid="confirm-delete-button"]');
        await confirmButton.click();

        // 等待删除完成
        await page.waitForTimeout(1000);

        // THEN: 应显示空状态
        const emptyState = page.locator('[data-testid="empty-state"]');
        await expect(emptyState).toBeVisible();
      }
    });

    test('[P2] 删除后刷新页面项目应仍被删除', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户删除了项目
      await page.goto('/my-projects');
      await page.waitForLoadState('networkidle');

      const pendingProjects = page.locator('[data-testid="status-pending"]');
      const pendingCount = await pendingProjects.count();

      if (pendingCount > 0) {
        const firstPending = pendingProjects.first();
        const deleteButton = firstPending.locator('[data-testid="delete-project-button"]');

        await deleteButton.click();

        const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]');
        const confirmButton = confirmDialog.locator('[data-testid="confirm-delete-button"]');
        await confirmButton.click();

        await page.waitForTimeout(1000);

        // WHEN: 刷新页面
        await page.reload();
        await page.waitForLoadState('networkidle');

        // THEN: 项目不应出现在列表中
        const projectItems = page.locator('[data-testid="my-project-item"]');
        const countAfter = await projectItems.count();
        expect(countAfter).toBeLessThan(pendingCount);
      }
    });
  });
});
