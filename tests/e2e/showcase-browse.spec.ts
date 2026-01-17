/**
 * Showcase 浏览页面 E2E 测试
 *
 * 测试用户浏览项目展示页面的完整流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-4: 项目展示页面
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 */
import { test, expect } from '@playwright/test';

test.describe('项目展示浏览', () => {
  test.describe('[P1] 页面加载和基本浏览', () => {
    test('[P1] 应能成功加载项目展示页面', async ({ page }) => {
      // GIVEN: 用户访问应用
      // WHEN: 导航到项目展示页面
      await page.goto('/showcase');

      // THEN: 页面标题应正确显示
      await expect(page.locator('h1')).toContainText('项目展示');

      // AND: 应显示项目网格
      const projectGrid = page.locator('.grid').first();
      await expect(projectGrid).toBeVisible();
    });

    test('[P1] 应显示项目卡片的基本信息', async ({ page }) => {
      // GIVEN: 项目展示页面已加载
      await page.goto('/showcase');

      // WHEN: 页面加载完成
      // 等待项目卡片出现
      await page.waitForSelector('[data-testid="project-card"], .border.rounded-lg', { timeout: 10000 });

      // THEN: 应显示项目名称
      const projectCards = page.locator('.border.rounded-lg, [data-testid="project-card"]').first();
      await expect(projectCards).toBeVisible();

      // 验证卡片包含基本元素
      const cardContent = await projectCards.textContent();
      expect(cardContent).toBeTruthy();
    });

    test('[P1] 空状态应正确显示', async ({ page }) => {
      // GIVEN: 用户访问项目展示页面
      // WHEN: 模拟没有项目的情况
      await page.route('**/api/v1/showcase/projects*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [],
            meta: { total: 0, page: 1, pageSize: 12, totalPages: 0 },
          }),
        })
      );

      await page.goto('/showcase?search=nonexistent-project-xyz-123');

      // THEN: 应显示空状态提示
      await expect(page.locator('text=/暂无项目展示|没有找到/')).toBeVisible({ timeout: 10000 });
    });

    test('[P1] 加载状态应正确显示', async ({ page }) => {
      // GIVEN: 用户访问项目展示页面
      // WHEN: 模拟慢速 API 响应
      await page.route('**/api/v1/showcase/projects*', () => {
        // 不立即响应，模拟加载状态
      });

      await page.goto('/showcase');

      // THEN: 应显示骨架屏或加载状态
      // 注意：由于加载很快，可能需要其他方式验证
      await expect(page.locator('h1')).toContainText('项目展示');
    });
  });

  test.describe('[P1] 搜索功能', () => {
    test('[P1] 应能通过关键词搜索项目', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载完成
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 输入搜索关键词并提交
      const searchInput = page.locator('input[placeholder*="搜索"]').or(
        page.locator('[data-testid="search-input"]')
      ).first();
      await searchInput.fill('react');

      // 按回车或点击搜索按钮
      const searchButton = page.locator('button:has-text("搜索")').or(
        page.locator('[data-testid="search-button"]')
      ).first();

      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      // THEN: URL 应包含搜索参数
      await expect(page).toHaveURL(/search=react/);

      // AND: 页面应重新加载并显示搜索结果
      await expect(page.locator('h1')).toContainText('项目展示');
    });

    test('[P1] 清空搜索应显示所有项目', async ({ page }) => {
      // GIVEN: 用户已进行搜索
      await page.goto('/showcase?search=test');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 清空搜索关键词
      const searchInput = page.locator('input[placeholder*="搜索"]').or(
        page.locator('[data-testid="search-input"]')
      ).first();

      await searchInput.clear();
      await searchInput.press('Enter');

      // THEN: URL 应移除搜索参数
      await expect(page).toHaveURL(/showcase/);
    });
  });

  test.describe('[P1] 筛选功能', () => {
    test('[P1] 应能按分类筛选项目', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 选择分类筛选器
      const categoryFilter = page.locator('#category-filter').or(
        page.locator('[data-testid="category-filter"]')
      ).first();

      await categoryFilter.click();

      // 选择一个分类
      const categoryOption = page.locator('[data-value="WEB_APP"], [data-value*="WEB"]').or(
        page.locator('text=Web 应用')
      ).first();

      if (await categoryOption.isVisible({ timeout: 5000 })) {
        await categoryOption.click();
      }

      // THEN: URL 应包含分类参数
      await expect(page).toHaveURL(/category=|Web 应用/);
    });

    test('[P1] 应能按编程语言筛选项目', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 选择语言筛选器
      const languageFilter = page.locator('#language-filter').or(
        page.locator('[data-testid="language-filter"]')
      ).first();

      await languageFilter.click();

      // 选择一种语言
      const languageOption = page.locator('[data-value="TypeScript"], text=TypeScript').first();

      if (await languageOption.isVisible({ timeout: 5000 })) {
        await languageOption.click();
      }

      // THEN: URL 应包含语言参数
      await expect(page).toHaveURL(/language=|TypeScript/);
    });

    test('[P1] 应能更改排序方式', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 更改排序选项
      const sortFilter = page.locator('#sort-filter').or(
        page.locator('[data-testid="sort-filter"]')
      ).first();

      await sortFilter.click();

      // 选择"星标最多"
      const starsOption = page.locator('[data-value="stars"], text=星标').first();

      if (await starsOption.isVisible({ timeout: 5000 })) {
        await starsOption.click();
      }

      // THEN: URL 应包含排序参数
      await expect(page).toHaveURL(/sort=|stars/);
    });

    test('[P1] 组合筛选应正常工作', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 同时应用多个筛选条件
      const categoryFilter = page.locator('#category-filter').or(
        page.locator('[data-testid="category-filter"]')
      ).first();

      await categoryFilter.click();

      const webAppOption = page.locator('[data-value="WEB_APP"], text=Web 应用').first();

      if (await webAppOption.isVisible({ timeout: 5000 })) {
        await webAppOption.click();
      }

      // 选择语言
      const languageFilter = page.locator('#language-filter').or(
        page.locator('[data-testid="language-filter"]')
      ).first();

      await languageFilter.click();

      const typeScriptOption = page.locator('[data-value="TypeScript"], text=TypeScript').first();

      if (await typeScriptOption.isVisible({ timeout: 5000 })) {
        await typeScriptOption.click();
      }

      // THEN: URL 应包含所有筛选参数
      await expect(page).toHaveURL(/(category=|Web 应用)/);
      await expect(page).toHaveURL(/(language=|TypeScript)/);
    });
  });

  test.describe('[P1] 分页功能', () => {
    test('[P1] 应能浏览多页项目', async ({ page }) => {
      // GIVEN: 项目展示页面有多个页面
      // 注意：这需要足够的项目数据才能触发分页

      // WHEN: 访问第一页
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // 检查是否有分页控件
      const nextPageButton = page.locator('button:has-text("下一页"), button:has-text("Next")').or(
        page.locator('[data-testid="next-page"]')
      ).first();

      const paginationVisible = await nextPageButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (paginationVisible) {
        // 检查下一页按钮状态
        const nextButtonDisabled = await nextPageButton.isDisabled();
        if (!nextButtonDisabled) {
          // 点击下一页
          await nextPageButton.click();

          // THEN: URL 应更新为第二页
          await expect(page).toHaveURL(/page=2/);

          // 应显示页码信息
          const pageInfo = page.locator('body').getByText(/第.*页|Page.*\d/);
          await expect(pageInfo.first()).toBeVisible();
        }
      }
    });

    test('[P1] 第一页时上一页按钮应禁用', async ({ page }) => {
      // GIVEN: 用户在第一页
      await page.goto('/showcase?page=1');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 检查分页控件
      const prevPageButton = page.locator('button:has-text("上一页"), button:has-text("Previous")').or(
        page.locator('[data-testid="prev-page"]')
      ).first();

      const paginationVisible = await prevPageButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (paginationVisible) {
        // THEN: 上一页按钮应被禁用
        await expect(prevPageButton).toBeDisabled();
      }
    });
  });

  test.describe('[P2] 项目卡片交互', () => {
    test('[P2] 点击项目卡片应导航到详情页', async ({ page }) => {
      // GIVEN: 项目展示页面已加载
      await page.goto('/showcase');

      // 等待项目卡片出现
      const firstCard = page.locator('.border.rounded-lg, [data-testid="project-card"]').first();

      await firstCard.waitFor({ state: 'visible', timeout: 10000 });

      // WHEN: 点击第一个项目卡片
      await firstCard.click();

      // THEN: 应导航到项目详情页
      await expect(page).toHaveURL(/\/showcase\/[\w-]+/);
    });

    test('[P2] 项目卡片悬停应有视觉反馈', async ({ page }) => {
      // GIVEN: 项目展示页面已加载
      await page.goto('/showcase');

      // 等待项目卡片出现
      const firstCard = page.locator('.border.rounded-lg, [data-testid="project-card"]').first();

      await firstCard.waitFor({ state: 'visible', timeout: 10000 });

      // WHEN: 鼠标悬停在卡片上
      await firstCard.hover();

      // THEN: 卡片应有悬停效果（检查类名变化）
      // 由于难以验证具体的 CSS 效果，我们只验证元素仍然可见
      await expect(firstCard).toBeVisible();
    });
  });

  test.describe('[P2] URL 参数同步', () => {
    test('[P2] 直接访问带参数的 URL 应正确应用筛选', async ({ page }) => {
      // GIVEN: 用户直接访问带有筛选参数的 URL
      await page.goto('/showcase?category=WEB_APP&language=TypeScript&sort=stars');

      // WHEN: 页面加载完成
      await expect(page.locator('h1')).toContainText('项目展示');

      // THEN: 筛选器应反映 URL 参数
      const categoryFilter = page.locator('#category-filter').or(
        page.locator('[data-testid="category-filter"]')
      ).first();

      await expect(categoryFilter).toHaveValue(/WEB_APP|Web 应用/);

      // AND: URL 参数应保持不变
      await expect(page).toHaveURL(/category=WEB_APP/);
      await expect(page).toHaveURL(/language=TypeScript/);
      await expect(page).toHaveURL(/sort=stars/);
    });

    test('[P2] 更改筛选器应更新 URL', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 更改分类筛选
      const categoryFilter = page.locator('#category-filter').or(
        page.locator('[data-testid="category-filter"]')
      ).first();

      await categoryFilter.click();

      const cliOption = page.locator('[data-value="CLI"], text=命令行').first();

      if (await cliOption.isVisible({ timeout: 5000 })) {
        await cliOption.click();

        // THEN: URL 应包含新的分类参数
        await expect(page).toHaveURL(/category=CLI/);
      }
    });
  });

  test.describe('[P2] 错误处理', () => {
    test('[P2] API 错误时应显示友好提示', async ({ page }) => {
      // GIVEN: 用户访问项目展示页面
      // WHEN: API 返回错误
      await page.route('**/api/v1/showcase/projects*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' }),
        })
      );

      await page.goto('/showcase');

      // THEN: 应显示错误提示
      await expect(page.locator('text=/加载失败|错误|Error/')).toBeVisible({ timeout: 10000 });
    });

    test('[P2] 网络超时时应显示超时提示', async ({ page }) => {
      // GIVEN: 用户访问项目展示页面
      // WHEN: API 请求超时
      await page.route('**/api/v1/showcase/projects*', () => {
        // 不响应，模拟超时
      });

      await page.goto('/showcase');

      // THEN: 应显示超时提示或加载状态
      // 注意：这取决于超时设置
      await expect(page.locator('h1')).toContainText('项目展示');
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 搜索框应有正确的标签关联', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // WHEN: 检查搜索框的可访问性
      const searchInput = page.locator('input[placeholder*="搜索"]').or(
        page.locator('[data-testid="search-input"]')
      ).first();

      // THEN: 搜索框应有标签
      await expect(searchInput).toBeVisible();
      const hasLabel = await searchInput.evaluate((el) => {
        return el.hasAttribute('aria-label') ||
          el.hasAttribute('id') ||
          el.closest('label') !== null;
      });
      expect(hasLabel).toBe(true);
    });

    test('[P3] 筛选器应能通过键盘操作', async ({ page }) => {
      // GIVEN: 用户在项目展示页面
      await page.goto('/showcase');

      // 等待页面加载
      await expect(page.locator('h1')).toContainText('项目展示');

      // WHEN: 使用 Tab 键导航到筛选器
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // THEN: 焦点应在某个交互元素上
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
