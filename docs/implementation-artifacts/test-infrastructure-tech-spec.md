# Tech-Spec: 前端测试基础设施

**创建日期:** 2026-01-03
**状态:** 待开发
**优先级:** 高 - 技术债务清理

---

## 概述

### 问题陈述

`apps/web` 前端项目当前**测试覆盖率为 0%**，与后端 ~70-80% 的测试覆盖率形成鲜明对比。这导致：

1. **功能回归风险** - UI 修改可能破坏现有功能，无测试保护
2. **重构困难** - 无法安全地重构前端代码
3. **质量隐患** - 依赖手动测试，效率低且覆盖不全

### 解决方案

引入 **Vitest** 测试框架 + **React Testing Library** + **MSW** (API Mock)，为前端项目建立完整的测试基础设施，并为已实现的核心功能补充测试。

### 范围 (In/Out)

| 包含 (In) | 排除 (Out) |
|-----------|-----------|
| 测试框架配置和工具函数 | shadcn/ui 第三方组件 |
| 认证相关 (登录/注册/Token) | E2E 测试 (Playwright) |
| 核心 Hooks (自定义 hooks) | 视觉回归测试 |
| 主要表单组件 | 性能测试 |
| API 客户端单元测试 | - |

---

## 开发上下文

### 技术栈

```json
{
  "framework": "React 18 + Vite 5",
  "language": "TypeScript 5",
  "testing": "Vitest + React Testing Library + MSW",
  "state": "Zustand 5 + React Query 5",
  "forms": "React Hook Form 7 + Zod 3",
  "ui": "Tailwind CSS + Radix UI",
  "routing": "React Router 6"
}
```

### 代码模式

**组件模式:**
- 函数式组件 + Hooks
- 使用 `cn()` 工具合并 className
- shadcn/ui 组件作为基础

**表单模式:**
- `react-hook-form` + `zod` schema 验证
- `<Form>` + `FormField` + `FormItem` 结构

**状态管理:**
- 服务端状态: React Query (`useQuery` / `useMutation`)
- 全局状态: Zustand (`auth.store`)
- 本地状态: `useState`

### 技术决策

**为什么选择 Vitest 而不是 Jest？**
- 与 Vite 原生集成，配置复用
- 启动速度快，支持 HMR
- TypeScript 开箱即用，无需 ts-jest

**为什么选择 MSW 而不是 axios-mock？**
- 拦截网络请求，不修改源代码
- 同时支持单元测试和集成测试
- 更接近真实环境

---

## 实施计划

### 任务清单

#### 阶段 1: 基础设施搭建

- [ ] **Task 1.1:** 安装测试依赖
  ```bash
  npm install -D vitest @vitest/ui @vitest/coverage-v8 \
    @testing-library/react @testing-library/jest-dom \
    @testing-library/user-event msw
  ```

- [ ] **Task 1.2:** 创建 Vitest 配置文件
  - 文件: `apps/web/vitest.config.ts`
  - 配置 jsdom 环境、路径别名、覆盖率阈值

- [ ] **Task 1.3:** 创建测试设置文件
  - 文件: `apps/web/src/test/setup.ts`
  - 配置 Testing Library 扩展、Mock 浏览器 API

- [ ] **Task 1.4:** 创建测试工具函数
  - 文件: `apps/web/src/test/utils/renderWithProviders.tsx`
  - 带 QueryClient/Router/Theme Provider 的渲染函数

- [ ] **Task 1.5:** 配置 MSW Mock Server
  - 文件: `apps/web/src/test/mocks/handlers.ts`
  - 文件: `apps/web/src/test/mocks/server.ts`
  - Mock 所有 API 端点

- [ ] **Task 1.6:** 更新 package.json 脚本
  ```json
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
  ```

#### 阶段 2: 核心功能测试 (优先级排序)

**优先级 1: 认证和 API (基础)**

- [ ] **Task 2.1:** 测试 Auth Store (`stores/auth.store.test.ts`)
  - 初始状态
  - setAuth / clearAuth
  - refreshAuth
  - localStorage 持久化

- [ ] **Task 2.2:** 测试 AuthProvider (`components/auth/AuthProvider.test.tsx`)
  - Token 初始化
  - 自动刷新机制
  - 登录态上下文

- [ ] **Task 2.3:** 测试 API Client (`lib/api.test.ts`)
  - 所有 API 方法签名
  - 请求拦截器 (Token 注入)
  - 响应拦截器 (401 处理)

**优先级 2: 表单组件**

- [ ] **Task 2.4:** 测试 LoginForm (`components/features/auth/LoginForm.test.tsx`)
  - 表单验证 (邮箱格式、密码长度)
  - 提交成功跳转
  - 提交失败错误显示
  - 按钮加载状态

- [ ] **Task 2.5:** 测试 RegisterForm (`components/features/auth/RegisterForm.test.tsx`)
  - 表单验证
  - 密码确认匹配
  - 注册成功处理

**优先级 3: 其他功能模块**

- [ ] **Task 2.6:** 测试管理组件 (`components/admin/*.test.tsx`)
  - 用户列表组件
  - 统计卡片组件

- [ ] **Task 2.7:** 测试自定义 Hooks (`hooks/*.test.ts`)
  - 按需添加

#### 阶段 3: 验收

- [ ] **Task 3.1:** 运行所有测试确保通过
  ```bash
  npm run test:run
  ```

- [ ] **Task 3.2:** 检查测试覆盖率
  ```bash
  npm run test:coverage
  ```
  目标: lines ≥ 70%, functions ≥ 70%, branches ≥ 60%

### 验收标准

**基础设施:**
- ✅ `npm run test` 可以运行测试
- ✅ `npm run test:ui` 可以打开 UI 界面
- ✅ `npm run test:coverage` 生成覆盖率报告

**测试覆盖:**
- ✅ Auth Store 完整测试
- ✅ AuthProvider 完整测试
- ✅ API Client 方法签名测试
- ✅ LoginForm/RegisterForm 测试
- ✅ 管理组件测试

**覆盖率目标:**
```
Lines:     ≥ 70%
Functions: ≥ 70%
Branches:  ≥ 60%
```

---

## 额外上下文

### 文件结构

```
apps/web/
├── vitest.config.ts                    [新建] - Vitest 配置
├── package.json                        [修改] - 添加测试脚本
├── src/
│   ├── test/                           [新建] - 测试基础设施
│   │   ├── setup.ts                    [新建] - 测试初始化
│   │   ├── utils/
│   │   │   └── renderWithProviders.tsx [新建] - 渲染工具
│   │   └── mocks/
│   │       ├── handlers.ts             [新建] - MSW API handlers
│   │       └── server.ts               [新建] - MSW server 配置
│   │
│   ├── stores/
│   │   └── auth.store.ts
│   │   └── auth.store.test.ts         [新建]
│   │
│   ├── lib/
│   │   └── api.ts
│   │   └── api.test.ts                [新建]
│   │
│   └── components/
│       ├── auth/
│       │   ├── AuthProvider.tsx
│       │   └── AuthProvider.test.tsx   [新建]
│       └── features/
│           ├── auth/
│           │   ├── LoginForm.tsx
│           │   ├── LoginForm.test.tsx  [新建]
│           │   ├── RegisterForm.tsx
│           │   └── RegisterForm.test.tsx [新建]
│           └── admin/
│               ├── *.tsx
│               └── *.test.tsx          [新建]
```

### 依赖安装命令

```bash
cd apps/web
npm install -D vitest @vitest/ui @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event msw
```

### 测试示例模板

**Hook 测试模板:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useCustomHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('应该正确获取数据', async () => {
    const { result } = renderHook(() => useCustomHook(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

**组件测试模板:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/renderWithProviders';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('应该渲染登录表单', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
  });

  it('应该验证邮箱格式', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/邮箱/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /登录/i }));

    expect(screen.getByText(/请输入有效的邮箱地址/i)).toBeInTheDocument();
  });
});
```

### 注意事项

1. **不测试第三方组件** - shadcn/ui 组件无需测试
2. **测试与源文件同目录** - 便于维护，`Component.test.tsx` 与 `Component.tsx` 放在一起
3. **使用 MSW Mock API** - 不依赖真实后端
4. **Mock 浏览器 API** - setup.ts 中已包含 IntersectionObserver、ResizeObserver 等
5. **TypeScript 配置** - 遵循项目的 TypeScript 配置

---

**文档版本:** 1.0
**最后更新:** 2026-01-03
