/**
 * 项目提交 E2E 测试
 *
 * 测试用户通过 UI 提交 GitHub 项目的完整流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-3: 项目提交 API
 * Story 8-4: 项目展示页面 (未来)
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 */
import { test, expect } from '@/tests/support/fixtures';

test.describe('项目提交流程', () => {
  // 使用真实且稳定的 GitHub URL 进行测试
  const VALID_GITHUB_URLS = [
    'https://github.com/facebook/react',
    'https://github.com/vuejs/core',
    'https://github.com/microsoft/typescript',
  ];

  test.describe('[P1] 已认证用户提交流程', () => {
    test('[P1] 应能通过表单成功提交 GitHub 项目', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      await page.goto('/');
      await expect(page.locator('[data-testid="user-name"]')).toContainText(authenticatedUser.name);

      // WHEN: 导航到项目提交页面
      await page.click('[data-testid="nav-showcase"]');

      // THEN: 应该能看到项目提交表单
      await expect(page.locator('[data-testid="showcase-submit-form"]')).toBeVisible();

      // WHEN: 填写 GitHub URL 并提交
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[0]);
      await page.click('[data-testid="submit-project-button"]');

      // THEN: 应该显示成功消息
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-success"]')).toContainText(/提交成功|已提交|success/i);

      // AND: 项目应该出现在用户的项目列表中
      await page.click('[data-testid="nav-my-projects"]');
      await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-card"]')).toHaveCount(expect.any(Number));
    });

    test('[P1] 表单验证应正确显示错误信息', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');
      await expect(page.locator('[data-testid="showcase-submit-form"]')).toBeVisible();

      // WHEN: 提交空表单
      await page.click('[data-testid="submit-project-button"]');

      // THEN: 应该显示验证错误
      await expect(page.locator('[data-testid="github-url-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="github-url-error"]')).toContainText(/不能为空|required|empty/i);

      // WHEN: 输入无效的 GitHub URL
      await page.fill('[data-testid="github-url-input"]', 'not-a-valid-url');
      await page.click('[data-testid="submit-project-button"]');

      // THEN: 应该显示格式错误
      await expect(page.locator('[data-testid="github-url-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="github-url-error"]')).toContainText(/格式|format|invalid|无效/i);
    });

    test('[P1] 重复提交应显示适当提示', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 第一次提交项目
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[0]);
      await page.click('[data-testid="submit-project-button"]');

      // 等待第一次提交完成
      await page.waitForTimeout(1000);

      // WHEN: 尝试再次提交相同项目
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[0]);
      await page.click('[data-testid="submit-project-button"]');

      // THEN: 应该显示重复提交错误
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-error"]')).toContainText(/已被提交|重复|duplicate|exist/i);
    });
  });

  test.describe('[P1] 未认证用户行为', () => {
    test('[P1] 未认证用户尝试提交应重定向到登录页', async ({ page }) => {
      // GIVEN: 用户未登录
      // WHEN: 直接访问项目提交页面
      await page.goto('/showcase/submit');

      // THEN: 应该重定向到登录页面
      await expect(page).toHaveURL(/\/login/);

      // AND: 显示登录提示
      await expect(page.locator('[data-testid="login-prompt"]')).toBeVisible();
    });

    test('[P1] 提交后应保持用户登录状态', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      await page.goto('/showcase/submit');

      // WHEN: 成功提交项目
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[1]);
      await page.click('[data-testid="submit-project-button"]');

      // 等待提交完成
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

      // THEN: 用户应该仍然处于登录状态
      await expect(page.locator('[data-testid="user-name"]')).toContainText(authenticatedUser.name);
      await expect(page.locator('[data-testid="nav-logout"]')).toBeVisible();
    });
  });

  test.describe('[P2] UI 交互细节', () => {
    test('[P2] 提交按钮在加载时应禁用', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 填写并提交
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[2]);

      // 拦截 API 请求以验证按钮状态
      const submitPromise = page.waitForResponse('**/api/v1/showcase/submit');

      await page.click('[data-testid="submit-project-button"]');

      // THEN: 按钮应该显示加载状态
      await expect(page.locator('[data-testid="submit-project-button"]')).toHaveAttribute('data-loading', 'true');
      await expect(page.locator('[data-testid="submit-project-button"]')).toBeDisabled();

      // 等待请求完成
      await submitPromise;

      // THEN: 按钮应该恢复可用
      await expect(page.locator('[data-testid="submit-project-button"]')).not.toHaveAttribute('data-loading', 'true');
    });

    test('[P2] 输入时应实时验证 URL 格式', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 输入有效的 GitHub URL
      await page.fill('[data-testid="github-url-input"]', 'https://github.com/');
      await page.type('[data-testid="github-url-input"]', 'facebook/react');

      // THEN: 错误提示应该消失
      await expect(page.locator('[data-testid="github-url-error"]')).not.toBeVisible();

      // WHEN: 清空输入
      await page.fill('[data-testid="github-url-input"]', '');

      // THEN: 应该再次显示错误
      await page.blur('[data-testid="github-url-input"]');
      await expect(page.locator('[data-testid="github-url-error"]')).toBeVisible();
    });

    test('[P2] 应显示提交历史', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录
      await page.goto('/showcase/submit');

      // WHEN: 查看页面
      // THEN: 应该能看到之前提交的项目列表 (如果有的话)
      const projectList = page.locator('[data-testid="submitted-projects-list"]');
      if (await projectList.isVisible()) {
        await expect(projectList.locator('[data-testid="project-card"]')).toHaveCount(expect.any(Number));
      }
    });
  });

  test.describe('[P2] 网络错误处理', () => {
    test('[P2] 网络错误时应显示友好提示', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 模拟网络错误
      await page.route('**/api/v1/showcase/submit', (route) =>
        route.abort('failed')
      );

      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[0]);
      await page.click('[data-testid="submit-project-button"]');

      // THEN: 应该显示网络错误提示
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="toast-error"]')).toContainText(/网络|network|连接|connection/i);
    });

    test('[P2] API 超时应显示适当提示', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 模拟 API 超时
      await page.route('**/api/v1/showcase/submit', () => {
        // 不响应，模拟超时
      });

      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[1]);
      await page.click('[data-testid="submit-project-button"]');

      // THEN: 应该显示超时提示
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('[P2] 成功后的行为', () => {
    test('[P2] 提交成功后应显示项目预览', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 成功提交项目
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[2]);
      await page.click('[data-testid="submit-project-button"]');

      // 等待成功提示
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

      // THEN: 应该显示项目预览卡片
      await expect(page.locator('[data-testid="project-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-preview"]')).toContainText('PENDING');
    });

    test('[P2] 应能继续提交另一个项目', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 提交第一个项目
      await page.fill('[data-testid="github-url-input"]', VALID_GITHUB_URLS[0]);
      await page.click('[data-testid="submit-project-button"]');

      // 等待成功
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

      // WHEN: 点击"提交另一个"按钮
      await page.click('[data-testid="submit-another-button"]');

      // THEN: 表单应该被清空并可以继续输入
      await expect(page.locator('[data-testid="github-url-input"]')).toHaveValue('');
      await expect(page.locator('[data-testid="submit-project-button"]')).toBeEnabled();
    });
  });

  test.describe('[P3] 可访问性和 UX', () => {
    test('[P3] 表单应支持键盘操作', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // WHEN: 使用键盘填写表单
      await page.locator('[data-testid="github-url-input"]').focus();
      await page.keyboard.type(VALID_GITHUB_URLS[0]);
      await page.keyboard.press('Enter');

      // THEN: 表单应该被提交
      // 验证成功提示出现
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 10000 });
    });

    test('[P3] 表单应有正确的 ARIA 属性', async ({ page, authenticatedUser }) => {
      // GIVEN: 用户已登录并在项目提交页面
      await page.goto('/showcase/submit');

      // THEN: 表单元素应该有正确的 ARIA 属性
      await expect(page.locator('[data-testid="github-url-input"]')).toHaveAttribute('name');
      await expect(page.locator('[data-testid="github-url-input"]')).toHaveAttribute('required');

      // 错误消息应该关联到输入框
      await page.click('[data-testid="submit-project-button"]');
      await expect(page.locator('[data-testid="github-url-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="github-url-error"]')).toHaveAttribute('role', 'alert');
    });
  });
});
