# E2E 测试与手工验收规范

**版本**: 1.0
**生效日期**: 2026-01-04
**适用范围**: 所有需要用户交互验证的功能

---

## 目录

1. [概述](#概述)
2. [E2E 测试框架](#e2e-测试框架)
3. [手工验收流程](#手工验收流程)
4. [验收检查清单](#验收检查清单)
5. [问题记录与跟踪](#问题记录与跟踪)

---

## 概述

### 为什么需要 E2E 测试和手工验收？

| 问题 | 根本原因 | 解决方案 |
|------|----------|----------|
| 功能在生产环境失效 | 开发环境与真实环境差异 | E2E 测试在真实浏览器验证 |
| UI 渲染时序问题 | 未验证真实 DOM 环境 | 真实浏览器环境测试 |
| 第三方集成问题 | Mock 数据与真实响应不一致 | 手工验证外部依赖 |

**核心原则**: 单元测试验证代码逻辑，E2E 测试验证用户价值。

### 何时使用 E2E 测试 vs 手工验收？

| 场景 | 推荐方式 | 理由 |
|------|----------|------|
| 表单交互、导航流程 | E2E 测试 | 可自动化、回归快 |
| 二维码、文件下载 | 手工验收 | 需要物理验证 |
| 第三方集成 | 手工验收 | 外部依赖不稳定 |
| 视觉/UI 一致性 | E2E 测试 + 截图 | 可自动对比 |
| 复杂多步骤流程 | E2E 测试 | 确保完整链路 |

---

## E2E 测试框架

### 技术栈

- **框架**: Playwright
- **语言**: TypeScript
- **运行命令**: `pnpm test:e2e`

### 测试文件位置

```
apps/web/
├── e2e/
│   ├── auth.spec.ts           # 认证流程
│   ├── navigation.spec.ts     # 导航测试
│   └── forms.spec.ts          # 表单交互
```

### 编写 E2E 测试的模板

```typescript
import { test, expect } from '@playwright/test';

test.describe('用户登录流程', () => {
  test('成功登录', async ({ page }) => {
    // 1. 导航到登录页
    await page.goto('/login');

    // 2. 填写表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // 3. 提交表单
    await page.click('button[type="submit"]');

    // 4. 验证结果
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=欢迎')).toBeVisible();
  });

  test('登录失败显示错误信息', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=用户名或密码错误')).toBeVisible();
  });
});
```

### E2E 测试最佳实践

1. **使用 data-testid**: 避免依赖 CSS 类名或文本内容
   ```typescript
   // 好
   await page.click('[data-testid="submit-button"]');

   // 避免
   await page.click('.btn-primary');
   ```

2. **等待策略**: 使用 Playwright 自动等待，避免固定延迟
   ```typescript
   // 好
   await expect(page.locator('[data-testid="result"]')).toBeVisible();

   // 避免
   await page.waitForTimeout(1000);
   ```

3. **独立性**: 每个测试独立运行，不依赖其他测试
4. **清理数据**: 测试后清理生成的数据

---

## 手工验收流程

### 准备工作

1. **启动开发服务器**
   ```bash
   pnpm dev
   ```

2. **准备测试数据**
   - 使用测试账号登录
   - 确保数据库状态清洁

3. **打开 Chrome DevTools**
   - 检查 Console 错误
   - 检查 Network 请求
   - 使用 Device Mode 模拟移动端

### 验收步骤

1. **功能验收**: 按照验收检查清单逐项验证
2. **UI 验收**: 检查布局、样式、响应式
3. **边界测试**: 测试异常输入、网络错误等
4. **跨浏览器** (如需要): Chrome, Firefox, Safari
5. **移动端测试** (如需要): iPhone, Android

### 验收通过标准

- [ ] 所有验收检查项通过
- [ ] 无 Console 错误
- [ ] 无 UI 明显缺陷
- [ ] 性能可接受 (操作响应 < 1s)

---

## 验收检查清单

### 通用检查项

#### 功能完整性
- [ ] 所有 AC (Acceptance Criteria) 满足
- [ ] 按钮点击有响应
- [ ] 表单验证正确
- [ ] 数据保存成功

#### 用户反馈
- [ ] 加载状态有提示
- [ ] 成功操作有 Toast/通知
- [ ] 错误有友好提示
- [ ] 空状态有占位提示

#### 错误处理
- [ ] 网络错误有提示
- [ ] 表单验证错误清晰
- [ ] 权限错误有引导
- [ ] 404 页面友好

#### 性能
- [ ] 页面加载时间可接受
- [ ] 操作响应时间 < 1s
- [ ] 无明显卡顿

### UI/UX 检查项

#### 桌面端 (1920x1080)
- [ ] 布局完整无错位
- [ ] 文字清晰可读
- [ ] 颜色对比度足够
- [ ] 交互区域有 hover 效果

#### 移动端 (375x667)
- [ ] 响应式布局正常
- [ ] 触摸操作流畅
- [ ] 文字大小适中
- [ ] 无横向滚动

#### 深色模式 (如支持)
- [ ] 所有元素可见
- [ ] 颜色对比度足够
- [ ] 图片/图标适配

---

## 问题记录与跟踪

### 发现问题时

1. **记录问题**:
   - 问题标题
   - 复现步骤
   - 预期行为 vs 实际行为
   - 截图/录屏

2. **分类问题**:
   - P0: 阻塞性问题 (必须修复才能验收)
   - P1: 重要问题 (影响体验)
   - P2: 一般问题 (不影响使用)

3. **跟踪修复**:
   - 记录到 Story 文档的 Dev Notes
   - 修复后重新验收
   - 验证通过才能关闭

### 问题记录模板

```markdown
## 问题: [标题]

**优先级**: P0 / P1 / P2
**发现时间**: YYYY-MM-DD
**发现人**: [名字]

**复现步骤**:
1.
2.
3.

**预期行为**:
[描述预期行为]

**实际行为**:
[描述实际行为]

**截图/录屏**:
[附件链接]

**修复状态**: 待修复 / 修复中 / 已验证
```

---

## 附录: 快速参考

### E2E 测试命令

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 运行特定文件
pnpm test:e2e auth.spec.ts

# 调试模式 (打开浏览器窗口)
pnpm test:e2e --debug

# 生成测试报告
pnpm test:e2e --reporter=html
```

### 常用选择器

```typescript
// data-testid (推荐)
page.locator('[data-testid="submit-button"]')

// 文本内容
page.locator('text=登录')
page.locator('text=/登录.*/')  // 正则

// CSS 选择器
page.locator('.btn-primary')
page.locator('#submit-button')

// 角色选择器
page.locator('button[name="submit"]')
page.locator('input[type="email"]')
```

---

*本文档将根据项目实践持续更新*
