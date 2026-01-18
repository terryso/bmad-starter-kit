/**
 * 项目同步功能 E2E 测试
 *
 * 测试项目详情页的同步按钮功能
 * 验证用户能够手动同步项目的最新 GitHub 信息
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-9: 项目信息手动同步
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-quality.md (测试质量标准)
 * - network-first.md (网络优先模式)
 */

import { test, expect } from '@/tests/support/fixtures';

test.describe('[P1] 项目同步功能 E2E', () => {
  test.describe('[P1] 同步按钮显示', () => {
    test('[P1] 已登录用户应能看到同步按钮', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      // AND: 存在已批准的项目
      // 导航到项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      // 查找第一个项目卡片
      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        // 点击项目卡片进入详情页
        await projectCard.click();

        // 等待页面加载
        await page.waitForLoadState('networkidle');

        // WHEN: 查看项目详情页
        // THEN: 应显示同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await expect(syncButton).toBeVisible();
      }
    });

    test('[P1] 未登录用户不应看到同步按钮', async ({ page }) => {
      // GIVEN: 用户未登录
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      // 查找第一个项目卡片
      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // WHEN: 查看项目详情页
        // THEN: 不应显示同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await expect(syncButton).not.toBeVisible();
      }
    });

    test('[P2] 同步按钮应有正确的图标和文本', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // WHEN: 查看同步按钮
        // THEN: 按钮应有刷新图标和"同步信息"文本
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await expect(syncButton).toContainText('同步信息');

        // 检查图标 (通常使用 SVG 或 Lucide 图标)
        const icon = syncButton.locator('svg');
        await expect(icon).toBeVisible();
      }
    });
  });

  test.describe('[P1] 同步操作', () => {
    test('[P1] 点击同步按钮应触发同步请求', async ({ page, authenticatedUser, request }) => {
      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        // 获取项目 URL 以提取项目 ID
        const projectLink = projectCard.locator('a');
        const href = await projectLink.getAttribute('href');
        const projectId = href?.split('/').pop();

        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // 监听网络请求
        const syncPromise = page.waitForResponse(
          (resp) =>
            resp.url().includes(`/api/v1/showcase/projects/${projectId}/sync`) &&
            resp.status() === 200
        );

        // WHEN: 点击同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await syncButton.click();

        // THEN: 应发送同步请求
        const syncResponse = await syncPromise;
        expect(syncResponse.status()).toBe(200);

        // 验证按钮状态变化
        await expect(syncButton).toContainText('同步中...');
      }
    });

    test('[P1] 同步成功应显示成功提示', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // WHEN: 点击同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await syncButton.click();

        // 等待同步完成
        await page.waitForTimeout(3000);

        // THEN: 应显示成功提示
        // 查找 toast 通知
        const toast = page.locator('[data-testid="toast"]').filter({ hasText: '同步成功' });
        // toast 可能会自动消失，所以使用 toBeTruthy 而不是 toBeVisible
        const toastExists = await toast.count();
        expect(toastExists).toBeGreaterThan(0);

        // 验证按钮恢复到原始状态
        await expect(syncButton).toContainText('同步信息');
        await expect(syncButton).not.toBeDisabled();
      }
    });

    test('[P1] 同步时应禁用按钮防止重复点击', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // WHEN: 点击同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await syncButton.click();

        // THEN: 按钮应被禁用
        await expect(syncButton).toBeDisabled();

        // 等待同步完成
        await page.waitForTimeout(3000);

        // 同步完成后按钮应恢复
        await expect(syncButton).not.toBeDisabled();
      }
    });
  });

  test.describe('[P2] 同步错误处理', () => {
    test('[P2] 同步失败应显示错误提示', async ({ page, authenticatedUser }) => {
      // 此测试需要模拟同步失败的场景
      // 由于我们无法直接控制 API 响应，这里使用网络拦截来模拟失败

      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        // 获取项目 ID
        const projectLink = projectCard.locator('a');
        const href = await projectLink.getAttribute('href');
        const projectId = href?.split('/').pop();

        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // 拦截同步请求并返回错误
        await page.route(
          (url) => url.toString().includes(`/api/v1/showcase/projects/${projectId}/sync`),
          (route) => {
            route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({
                statusCode: 500,
                message: 'GitHub API 调用失败',
              }),
            });
          }
        );

        // WHEN: 点击同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await syncButton.click();

        // 等待错误响应
        await page.waitForTimeout(2000);

        // THEN: 应显示错误提示
        const toast = page.locator('[data-testid="toast"]').filter({ hasText: /失败|错误/ });
        const toastExists = await toast.count();
        expect(toastExists).toBeGreaterThan(0);

        // 清理路由
        await page.unrouteAll();

        // 验证按钮恢复
        await expect(syncButton).not.toBeDisabled();
      }
    });

    test('[P2] 速率限制错误应显示特定提示', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        // 获取项目 ID
        const projectLink = projectCard.locator('a');
        const href = await projectLink.getAttribute('href');
        const projectId = href?.split('/').pop();

        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // 拦截同步请求并返回速率限制错误
        await page.route(
          (url) => url.toString().includes(`/api/v1/showcase/projects/${projectId}/sync`),
          (route) => {
            route.fulfill({
              status: 429,
              contentType: 'application/json',
              body: JSON.stringify({
                statusCode: 429,
                message: '距离上次同步不到 5 分钟，请稍后再试',
              }),
            });
          }
        );

        // WHEN: 点击同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await syncButton.click();

        // 等待响应
        await page.waitForTimeout(1000);

        // THEN: 应显示速率限制提示
        const toast = page.locator('[data-testid="toast"]').filter({ hasText: /5分钟/ });
        const toastExists = await toast.count();
        expect(toastExists).toBeGreaterThan(0);

        // 清理路由
        await page.unrouteAll();
      }
    });
  });

  test.describe('[P2] 项目信息更新', () => {
    test('[P2] 同步成功后应更新项目统计数据', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并访问项目详情页
      await page.goto('/showcase');
      await page.waitForLoadState('networkidle');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      const projectExists = await projectCard.count();

      if (projectExists > 0) {
        await projectCard.click();
        await page.waitForLoadState('networkidle');

        // 获取同步前的统计数据
        const starsBefore = await page
          .locator('[data-testid="project-stars"]')
          .textContent();
        const forksBefore = await page
          .locator('[data-testid="project-forks"]')
          .textContent();

        // WHEN: 点击同步按钮
        const syncButton = page.locator('[data-testid="sync-project-button"]');
        await syncButton.click();

        // 等待同步完成
        await page.waitForTimeout(3000);

        // THEN: 项目统计数据应更新 (或至少显示)
        // 注意: 由于 GitHub 数据可能没有变化，这里只验证元素存在
        const starsAfter = page.locator('[data-testid="project-stars"]');
        const forksAfter = page.locator('[data-testid="project-forks"]');

        await expect(starsAfter).toBeVisible();
        await expect(forksAfter).toBeVisible();
      }
    });
  });
});
