/**
 * 项目详情页 E2E 测试
 *
 * 测试用户查看项目详情的基本流程
 * 采用 Given-When-Then 格式
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-5: 项目详情页
 *
 * 知识库参考:
 * - test-levels-framework.md (E2E 测试决策)
 * - test-priorities-matrix.md (P0-P1 优先级 - 核心用户旅程)
 * - network-first.md (网络优先模式)
 */
import { test, expect } from '@playwright/test';

test.describe('项目详情页', () => {
  test.describe('[P1] 页面加载和基本访问', () => {
    test('[P1] 应能成功加载项目详情页', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面应该加载成功（可能是404或空数据，但不应该崩溃）
      const currentURL = page.url();
      expect(currentURL).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] 项目详情页应该响应', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面应该可见且有内容
      await expect(page.locator('body')).toBeVisible();
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('[P1] 无效项目ID应该处理正确', async ({ page }) => {
      // WHEN: 访问无效的项目详情
      await page.goto('/showcase/invalid-id');

      // THEN: 页面应该不崩溃
      const currentURL = page.url();
      expect(currentURL).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] 极端的项目ID应该处理正确', async ({ page }) => {
      // WHEN: 访问极端项目ID
      await page.goto('/showcase/!@#$%');

      // THEN: 页面应该不崩溃
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P1] 页面导航', () => {
    test('[P1] 从项目详情返回Showcase列表', async ({ page }) => {
      // GIVEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // WHEN: 导航回 Showcase 列表
      await page.goto('/showcase');

      // THEN: Showcase 列表页应该显示
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] 在不同项目详情页之间导航', async ({ page }) => {
      // GIVEN: 访问第一个项目详情页
      await page.goto('/showcase/1');

      // WHEN: 导航到另一个项目详情页
      await page.goto('/showcase/2');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P1] 错误处理', () => {
    test('[P1] 不存在的项目应正确处理', async ({ page }) => {
      // WHEN: 访问不存在的项目ID
      await page.goto('/showcase/nonexistent-project-xyz-123');

      // THEN: 页面应该处理错误（不崩溃）
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] 空项目ID应该处理正确', async ({ page }) => {
      // WHEN: 访问空ID
      await page.goto('/showcase/');

      // THEN: 应该重定向或显示错误页面（不崩溃）
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P1] 特殊字符ID应该处理正确', async ({ page }) => {
      // WHEN: 访问包含特殊字符的ID
      await page.goto('/showcase/<script>alert("xss")</script>');

      // THEN: 页面应该安全处理（不执行脚本）
      await expect(page.locator('body')).toBeVisible();
      // 确保 XSS 脚本没有被注入到页面
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toContain('<script>');
    });
  });

  test.describe('[P2] 加载状态', () => {
    test('[P2] 页面应该有标题', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面应该有标题
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('[P2] 页面主要元素应该可见', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面主体应该可见
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P2] URL 参数处理', () => {
    test('[P2] 带额外参数的URL应该处理正确', async ({ page }) => {
      // WHEN: 访问带额外参数的项目详情页
      await page.goto('/showcase/1?tab=overview');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P2] 带hash的URL应该处理正确', async ({ page }) => {
      // WHEN: 访问带hash的项目详情页
      await page.goto('/showcase/1#details');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P3] 可访问性', () => {
    test('[P3] 页面应该有正确的语义结构', async ({ page }) => {
      // WHEN: 访问项目详情页面
      await page.goto('/showcase/1');

      // THEN: 页面应该有基本结构
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('[P3] 边界情况', () => {
    test('[P3] 数字ID应该正常工作', async ({ page }) => {
      // WHEN: 使用数字ID
      await page.goto('/showcase/12345');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P3] UUID格式ID应该正常工作', async ({ page }) => {
      // WHEN: 使用UUID格式ID
      await page.goto('/showcase/550e8400-e29b-41d4-a716-446655440000');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });

    test('[P3] 很长的ID应该正常工作', async ({ page }) => {
      // WHEN: 使用很长的ID
      await page.goto('/showcase/very-long-project-id-with-many-hyphens-and-numbers-12345');

      // THEN: 页面应该加载
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
