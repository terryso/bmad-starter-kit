# 测试套件文档

## 概述

本项目使用 Playwright 作为端到端测试框架，提供跨浏览器测试能力和强大的调试功能。

**测试框架:**
- **E2E 测试**: Playwright (跨浏览器支持: Chrome, Firefox, Safari)
- **单元测试**: Vitest (前端) / Jest (后端)

---

## 测试结构

```
tests/
├── api/                    # API 集成测试文件
│   ├── auth.spec.ts        # 认证 API 测试
│   ├── admin.spec.ts       # 管理员 API 测试
│   ├── user-profile.spec.ts # 用户资料 API 测试
│   ├── showcase.spec.ts    # 项目展示 API 测试
│   ├── showcase-related.spec.ts # 相关项目 API 测试 (新增)
│   ├── showcase-delete.spec.ts # 删除项目 API 测试 (新增)
│   ├── showcase-sync.spec.ts # 同步项目 API 测试 (新增)
│   ├── admin-showcase.spec.ts # 管理员审核 API 测试
│   ├── project-detail.spec.ts # 项目详情 API 测试
│   ├── my-projects.spec.ts # 我的项目 API 测试
│   └── fixtures.ts         # API 测试 fixtures
├── e2e/                    # E2E 测试文件
│   ├── project-submission.spec.ts # 项目提交 E2E 测试
│   ├── my-projects.spec.ts # 我的项目管理 E2E 测试
│   ├── my-projects-delete.spec.ts # 删除项目 E2E 测试 (新增)
│   ├── project-sync.spec.ts # 同步项目 E2E 测试 (新增)
│   ├── auth.spec.ts        # 认证流程测试
│   ├── admin.spec.ts       # 管理员功能测试
│   ├── profile.spec.ts     # 用户资料页面测试
│   ├── showcase-browse.spec.ts # 项目展示浏览测试
│   ├── showcase-navigation.spec.ts # 展示页导航测试
│   ├── project-detail.spec.ts # 项目详情页面测试
│   ├── admin-showcase.spec.ts # 管理员审核界面测试
│   ├── admin-enhanced.spec.ts # 增强管理功能测试
│   ├── login-flow.spec.ts  # 登录流程测试
│   └── setup-auth.spec.ts  # 认证设置测试
├── support/                # 测试基础设施
│   ├── fixtures/           # 测试 Fixtures
│   │   ├── index.ts        # Fixture 入口
│   │   └── factories/      # 数据工厂
│   │       ├── user-factory.ts    # 用户数据工厂
│   │       └── project.factory.ts # 项目数据工厂
│   ├── helpers/            # 辅助函数
│   │   ├── api.ts          # API 请求辅助
│   │   └── selectors.ts    # 选择器定义 (已增强)
│   └── tsconfig.json       # TypeScript 配置
├── global-setup.ts         # 全局测试设置
├── README.md               # 本文档
└── tsconfig.json           # 测试目录 TypeScript 配置
```

---

## 环境设置

### 1. 安装依赖

```bash
# 安装 Playwright 和浏览器
pnpm install

# 安装 Playwright 浏览器 (首次运行)
npx playwright install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置:

```bash
cp .env.example .env
```

编辑 `.env` 文件:

```bash
BASE_URL=http://localhost:5173  # 前端应用地址
API_URL=http://localhost:3000   # 后端 API 地址
```

### 3. Node 版本

确保使用正确的 Node 版本:

```bash
# 使用 nvm
nvm use

# 或查看要求的版本
cat .nvmrc
```

---

## 运行测试

### 基本命令

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 使用 UI 模式运行 (推荐用于开发)
pnpm test:e2e:ui

# 使用 headed 模式运行 (显示浏览器窗口)
pnpm test:e2e:headed

# 调试模式
pnpm test:e2e:debug

# 查看测试报告
pnpm test:e2e:report
```

### 运行特定测试

```bash
# 运行单个测试文件
npx playwright test example.spec.ts

# 运行特定测试行
npx playwright test example.spec.ts:10

# 按名称过滤
npx playwright test --grep "应该能加载首页"
```

### 浏览器选择

```bash
# 仅在 Chrome 中运行
npx playwright test --project=chromium

# 仅在 Firefox 中运行
npx playwright test --project=firefox

# 仅在 Safari 中运行
npx playwright test --project=webkit
```

---

## 编写测试

### 基础测试结构

所有测试应遵循 **Given-When-Then** 模式:

```typescript
import { test, expect } from '@/tests/support/fixtures';

test('[P0] 应该能加载首页', async ({ page }) => {
  // GIVEN: 用户访问首页
  await page.goto('/');

  // THEN: 页面标题可见
  await expect(page).toHaveTitle(/BMAD Starter Kit|首页/);
});
```

### 使用 Fixtures

```typescript
import { test, expect } from '@/tests/support/fixtures';

test('应该创建测试用户', async ({ userFactory }) => {
  // GIVEN: 使用数据工厂创建用户
  const user = userFactory.createUser({
    email: 'custom@example.com',
  });

  // THEN: 用户数据有效
  expect(user.email).toBe('custom@example.com');
});
```

### 选择器策略

**推荐**: 使用 `data-testid` 属性作为主要选择策略

```typescript
// 在组件中添加 data-testid
<input data-testid="email-input" />

// 在测试中使用
await page.fill('[data-testid="email-input"]', 'test@example.com');
```

使用预定义的选择器:

```typescript
import { selectors } from '@/tests/support/helpers/selectors';

test('登录表单测试', async ({ page }) => {
  await page.goto('/login');
  await page.fill(selectors.auth.emailInput, 'test@example.com');
  await page.fill(selectors.auth.passwordInput, 'password');
  await page.click(selectors.auth.loginButton);
});
```

### 网络请求处理

```typescript
test('API 拦截测试', async ({ page }) => {
  // 模拟 API 响应
  await page.route('**/api/user', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1', name: '测试用户' }),
    }),
  );

  await page.goto('/profile');
  await expect(page.locator('[data-testid="user-name"]')).toHaveText('测试用户');
});
```

---

## 测试优先级

使用优先级标签对测试进行分类:

| 优先级 | 描述 | 执行频率 | 示例 |
|--------|------|----------|------|
| **P0** | 关键路径、安全相关 | 每次提交 | 登录流程、支付 |
| **P1** | 高价值功能 | PR 合并前 | 表单验证、错误处理 |
| **P2** | 中等优先级 | 每夜构建 | 边界情况、加载状态 |
| **P3** | 低优先级 | 按需执行 | 可选功能 |

### 在测试中使用优先级

```typescript
test('[P0] 应该能登录', async ({ page }) => { ... });
test('[P1] 应该显示错误消息', async ({ page }) => { ... });
test('[P2] 应该记住登录状态', async ({ page }) => { ... });
```

---

## 最佳实践

### ✅ 应该做的

1. **使用 Given-When-Then 结构**
   ```typescript
   test('应该登录成功', async ({ page }) => {
     // GIVEN: 用户在登录页
     await page.goto('/login');

     // WHEN: 输入凭证并提交
     await page.fill('[data-testid="email-input"]', 'user@example.com');
     await page.click('[data-testid="login-button"]');

     // THEN: 导航到仪表板
     await expect(page).toHaveURL('/dashboard');
   });
   ```

2. **使用 data-testid 选择器**
   ```typescript
   // ✅ 稳定
   await page.click('[data-testid="submit-button"]');

   // ❌ 脆弱
   await page.click('.btn-primary');
   ```

3. **一个测试一个断言**
   ```typescript
   // ✅ 原子化测试
   test('应该显示错误消息', async ({ page }) => {
     await page.goto('/login');
     await page.click('[data-testid="login-button"]');
     await expect(page.locator('[data-testid="error"]')).toBeVisible();
   });
   ```

4. **使用数据工厂生成测试数据**
   ```typescript
   // ✅ 随机数据
   const user = userFactory.createUser();
   await page.fill('[data-testid="email-input"]', user.email);
   ```

### ❌ 不应该做的

1. **避免硬编码等待**
   ```typescript
   // ❌ 错误
   await page.waitForTimeout(2000);

   // ✅ 正确
   await expect(page.locator('[data-testid="result"]')).toBeVisible();
   ```

2. **避免条件测试逻辑**
   ```typescript
   // ❌ 错误
   if (await element.isVisible()) {
     await element.click();
   }

   // ✅ 正确
   await expect(element).toBeVisible();
   await element.click();
   ```

3. **避免测试实现细节**
   ```typescript
   // ❌ 测试内部状态
   expect(component.state.loading).toBe(false);

   // ✅ 测试用户可见行为
   await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();
   ```

---

## 调试测试

### 使用 Trace Viewer

失败的测试会自动保存 trace 信息:

```bash
# 查看 trace
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 使用截图和视频

失败时自动捕获截图和视频，保存在 `test-results/` 目录。

### 调试模式

```bash
# 启动调试模式
pnpm test:e2e:debug

# 或使用 Playwright Inspector
npx playwright test --debug
```

---

## CI/CD 集成

测试在 CI 环境中运行时:

1. 自动重试失败测试 (最多 2 次)
2. 生成 JUnit XML 报告
3. 生成 HTML 报告
4. 禁用 `test.only`

### CI 配置示例

```yaml
- name: Run E2E tests
  run: pnpm test:e2e
  env:
    BASE_URL: http://localhost:5173
    CI: true
```

---

## 数据工厂

### UserFactory

生成测试用户数据:

```typescript
import { UserFactory } from '@/tests/support/fixtures/factories/user-factory';

const factory = new UserFactory();

// 创建默认用户
const user = factory.createUser();

// 创建自定义用户
const admin = factory.createUser({
  email: 'admin@example.com',
  role: 'admin',
});

// 创建多个用户
const users = factory.createUsers(5);

// 自动清理 (在测试结束后)
await factory.cleanup();
```

### ProjectFactory

生成项目展示测试数据:

```typescript
import { ProjectFactory } from '@/tests/support/fixtures/factories/project.factory';

const factory = new ProjectFactory();

// 创建项目数据
const project = factory.createProject();

// 创建自定义项目
const customProject = factory.createProject({
  githubUrl: 'https://github.com/facebook/react',
  category: 'LIBRARY',
  language: 'TypeScript',
});

// 创建有效的 GitHub URL
const githubUrl = factory.createValidGithubUrl();

// 创建无效的 GitHub URL (用于测试验证)
const invalidUrl = factory.createInvalidGithubUrl('incomplete');
```

---

## 故障排查

### 浏览器未安装

```bash
npx playwright install
```

### 端口冲突

确保 `BASE_URL` 指向的应用正在运行:

```bash
# 启动应用
pnpm dev

# 在另一个终端运行测试
pnpm test:e2e
```

### 超时错误

在 `playwright.config.ts` 中调整超时设置:

```typescript
timeout: 60 * 1000,        // 测试超时
actionTimeout: 15 * 1000,  // 操作超时
navigationTimeout: 30 * 1000, // 导航超时
```

---

## 资源

- [Playwright 文档](https://playwright.dev/)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [选择器指南](https://playwright.dev/docs/selectors)
