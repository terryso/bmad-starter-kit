# Story 2.4: 前端认证 UI 和集成

Status: done

## Story

作为 用户,
我想要 在界面上完成注册和登录,
以便 我可以直观地使用认证功能.

## Acceptance Criteria

**Given** 后端认证 API 已就绪 (Story 2.1, 2.2, 2.3 完成)
**When** 用户访问注册/登录页面
**Then** 显示注册表单 (邮箱、密码、姓名)
**And** 显示登录表单 (邮箱、密码)
**And** 表单验证即时反馈
**And** 注册/登录成功后跳转到首页
**And** 登录状态在全局状态中管理
**And** Access Token 存储在内存中
**And** 自动在请求头中携带 Authorization: Bearer token

## Tasks / Subtasks

- [x] 1. 创建认证状态管理 (AC: #6, #7)
  - [x] 1.1 创建 `apps/web/src/stores/auth.store.ts`
  - [x] 1.2 使用 Zustand 管理认证状态
  - [x] 1.3 存储 user, accessToken, isAuthenticated
  - [x] 1.4 实现 login, register, logout 方法

- [x] 2. 创建 API 客户端 (AC: #8)
  - [x] 2.1 创建 `apps/web/src/lib/api.ts`
  - [x] 2.2 配置 axios base URL
  - [x] 2.3 添加请求拦截器自动携带 Authorization
  - [x] 2.4 添加响应拦截器处理 401 自动登出

- [x] 3. 创建认证页面 UI (AC: #1, #2)
  - [x] 3.1 创建 `apps/web/src/pages/Login.tsx`
  - [x] 3.2 创建 `apps/web/src/pages/Register.tsx`
  - [x] 3.3 使用 shadcn/ui Form 组件
  - [x] 3.4 添加表单验证 (邮箱格式、密码长度)
  - [x] 3.5 添加切换登录/注册的链接

- [x] 4. 实现注册功能 (AC: #1, #3, #4)
  - [x] 4.1 调用 POST /api/v1/auth/register
  - [x] 4.2 处理成功响应 (201)
  - [x] 4.3 处理邮箱已存在错误 (409)
  - [x] 4.4 处理验证错误 (400)
  - [x] 4.5 成功后自动登录或跳转到登录页

- [x] 5. 实现登录功能 (AC: #2, #3, #4, #5)
  - [x] 5.1 调用 POST /api/v1/auth/login
  - [x] 5.2 处理成功响应 (200)
  - [x] 5.3 存储 accessToken 到内存
  - [x] 5.4 存储 user 信息
  - [x] 5.5 跳转到首页

- [x] 6. 添加受保护路由逻辑 (AC: #6, #7)
  - [x] 6.1 在 App.tsx 中实现路由守卫 (内联方式)
  - [x] 6.2 未登录用户访问受保护页面时跳转到登录
  - [x] 6.3 已登录用户自动携带 Token

- [x] 7. 更新导航栏 (AC: #6)
  - [x] 7.1 未登录时显示"登录"和"注册"按钮
  - [x] 7.2 已登录时显示用户信息
  - [x] 7.3 添加"登出"按钮 (功能在 Story 2.5 实现)

- [x] 8. 测试验证
  - [x] 8.1 测试注册流程完整可用
  - [x] 8.2 测试登录流程完整可用
  - [x] 8.3 测试表单验证正确显示
  - [x] 8.4 测试错误处理正确显示
  - [x] 8.5 测试登录后状态保持

## Dev Notes

### Epic Context

**Epic 2 目标**: 用户可以注册账号、登录系统并管理个人资料

这是 Epic 2 的第四个 Story。前序 Story 已完成:
- ✅ Story 2.1: 用户注册功能 - User 表、密码加密、注册 API
- ✅ Story 2.2: 用户登录功能 - JWT Token 生成、登录 API、JwtStrategy
- ✅ Story 2.3: JWT 认证守卫 - JwtAuthGuard、CurrentUser 装饰器

**本 Story 的重要性:**
前端认证 UI 是用户与认证系统交互的第一触点:
1. 提供直观的注册和登录界面
2. 管理全局认证状态
3. 自动在 API 请求中携带 Token
4. 为后续功能提供认证基础

**后续 Story 依赖:**
- Story 2.5 (登出) 将使用本 Story 的认证状态管理
- Story 2.6 (个人资料管理) 将依赖本 Story 的登录状态
- Epic 3 (视频管理) 所有功能都依赖本 Story 的认证

### Architecture Compliance

**前端架构决策** (来源: `docs/planning-artifacts/architecture.md#Project Structure & Boundaries`)

```
apps/web/src/
├── components/
│   ├── features/
│   │   └── auth/              # 认证组件 (本 Story)
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
├── pages/
│   ├── Login.tsx              # 登录页面
│   └── Register.tsx           # 注册页面
├── stores/
│   └── auth.store.ts          # 认证状态管理 (本 Story)
└── lib/
    └── api.ts                 # API 客户端 (本 Story)
```

**技术栈:**
| 组件 | 技术选择 | 说明 |
|------|----------|------|
| 状态管理 | Zustand | 轻量级全局状态 |
| HTTP 客户端 | axios | 请求/响应拦截器 |
| 表单组件 | shadcn/ui Form | React Hook Form |
| 表单验证 | Zod | 与 shared 类型一致 |
| 路由 | React Router | 路由守卫 |

**API 端点** (已实现):
```
POST /api/v1/auth/register  # 注册 (Story 2.1)
POST /api/v1/auth/login     # 登录 (Story 2.2)
POST /api/v1/auth/logout    # 登出 (Story 2.5)
GET  /api/v1/users/me       # 当前用户 (Story 2.3)
```

**Token 存储策略** (来源: `docs/planning-artifacts/architecture.md#Authentication & Security`)
```
Access Token:  存储在内存 (Zustand store)
Refresh Token: 存储在 HttpOnly Cookie (后端设置)
```

**设计系统** (来源: `docs/planning-artifacts/ux-design-specification.md`):
- 使用 shadcn/ui 组件保持一致
- 表单验证即时反馈 (<100ms)
- 错误信息友好清晰
- 响应式设计 (移动优先)

### Previous Story Intelligence

**Story 2.3 完成总结** (来源: `docs/implementation-artifacts/2-3-jwt-auth-guard.md`)

Story 2.3 实现了 JWT 认证守卫:
- ✅ JwtAuthGuard 继承 AuthGuard('jwt')
- ✅ CurrentUser 装饰器从 request 提取用户
- ✅ GET /api/v1/users/me 测试端点
- ✅ @Public() 装饰器标记公开路由

**后端 API 现状**:
```typescript
// 已实现的认证端点
POST /api/v1/auth/register  // 注册
POST /api/v1/auth/login     // 登录

// 响应格式 (注册成功 201):
{
  "statusCode": 201,
  "message": "注册成功",
  "data": {
    "id": "clxxxxxx",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2025-12-30T00:00:00.000Z"
  }
}

// 响应格式 (登录成功 200):
{
  "statusCode": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxxxxx",
      "email": "user@example.com",
      "name": "张三",
      "createdAt": "2025-12-30T00:00:00.000Z"
    }
  }
}

// 错误响应 (409 - 邮箱已存在):
{
  "statusCode": 409,
  "message": "该邮箱已被注册",
  "error": "Conflict"
}

// 错误响应 (401 - 登录失败):
{
  "statusCode": 401,
  "message": "邮箱或密码错误",
  "error": "Unauthorized"
}
```

**Story 2.2 完成总结** (来源: `docs/implementation-artifacts/2-2-user-login.md`)

- ✅ Access Token 有效期 15 分钟
- ✅ Refresh Token 存储在 HttpOnly Cookie
- ✅ Cookie 设置: httpOnly=true, secure=false (开发环境), sameSite=lax

**Story 2.1 完成总结** (来源: `docs/implementation-artifacts/2-1-user-registration.md`)

- ✅ RegisterDto 验证规则已定义
- ✅ 密码最少 8 位
- ✅ 邮箱格式验证

**前端现有组件** (来源: `apps/web/src/components/`):
- ✅ shadcn/ui Form, Input, Button, Card 等组件可用
- ✅ DashboardLayout - 主布局
- ✅ Header - 顶部导航栏
- ✅ ThemeToggle - 主题切换

### Technical Requirements

**依赖安装**:
```bash
# 状态管理
pnpm --filter @bmad-starter-kit/web add zustand

# HTTP 客户端
pnpm --filter @bmad-starter-kit/web add axios

# 表单验证 (如未安装)
pnpm --filter @bmad-starter-kit/web add react-hook-form @hookform/resolvers
pnpm --filter @bmad-starter-kit/web add zod
```

**认证状态管理 (Zustand)**:
```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: true,
      }),
      clearAuth: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // 不持久化 accessToken，只存在内存中
      }),
    }
  )
);
```

**API 客户端配置**:
```typescript
// lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动携带 Token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authApi = {
  register: async (data: RegisterDto) => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },
  login: async (data: LoginDto) => {
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/v1/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  },
};
```

**共享类型** (来源: `packages/shared/src/types/user.types.ts`):
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: User;
}
```

### File Structure Requirements

**目标文件结构**:
```
apps/web/src/
├── components/
│   └── features/
│       └── auth/
│           ├── LoginForm.tsx         # 新增 - 登录表单组件
│           └── RegisterForm.tsx      # 新增 - 注册表单组件
├── pages/
│   ├── Login.tsx                    # 新增 - 登录页面
│   └── Register.tsx                 # 新增 - 注册页面
├── stores/
│   └── auth.store.ts                # 新增 - 认证状态管理
├── lib/
│   └── api.ts                       # 新增 - API 客户端
├── routes/
│   └── index.tsx                    # 修改 - 添加路由守卫
└── components/layout/
    └── Header.tsx                   # 修改 - 添加登录/登出按钮
```

### Project Structure Notes

**与现有代码的集成**:
1. 使用现有的 shadcn/ui 组件 (Form, Input, Button, Card)
2. 集成到现有的 DashboardLayout
3. 更新 Header 组件显示登录状态

**Monorepo 类型共享**:
```typescript
// 从 @bmad-starter-kit/shared 导入类型
import type { RegisterDto, LoginDto, User } from '@bmad-starter-kit/shared';
```

**与后续 Story 的衔接**:
- **Story 2.5 (登出)**: 使用 auth.store.clearAuth() 方法
- **Story 2.6 (个人资料)**: 使用 auth.store.user 显示信息
- **Epic 3 (视频管理)**: 使用 api 客户端的自动 Token 携带

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **Token 持久化到 localStorage**
   - Access Token 只应存在内存中
   - Refresh Token 由后端 HttpOnly Cookie 管理

2. **忽略错误处理**
   - 必须处理 409 (邮箱已存在)
   - 必须处理 401 (登录失败)
   - 必须处理 400 (验证失败)

3. **表单验证不完整**
   - 邮箱格式必须验证
   - 密码长度必须 >= 8 位
   - 必填字段不能为空

4. **登录状态不刷新**
   - 页面刷新后应保持登录状态
   - 使用 Zustand persist 中间件

5. **API 调用硬编码 URL**
   - 使用环境变量 VITE_API_URL
   - 创建 axios 实例统一管理

**✅ 正确做法:**

1. Access Token 存内存，用 Zustand persist 保存用户信息
2. 完整的错误处理和用户友好提示
3. 使用 Zod schema 验证表单
4. 使用请求/响应拦截器统一处理
5. 使用环境变量配置 API URL

### Testing Requirements

**验证清单:**

1. **状态管理**
   - [ ] auth.store.ts 正确创建
   - [ ] 登录后 user 和 accessToken 正确存储
   - [ ] 登出后状态正确清除
   - [ ] 页面刷新后登录状态保持

2. **注册功能**
   - [ ] 注册表单正确显示
   - [ ] 邮箱格式验证生效
   - [ ] 密码长度验证生效
   - [ ] 注册成功跳转到登录页或首页
   - [ ] 邮箱已存在显示错误提示

3. **登录功能**
   - [ ] 登录表单正确显示
   - [ ] 登录成功跳转到首页
   - [ ] 登录失败显示错误提示
   - [ ] Token 正确存储到内存

4. **API 客户端**
   - [ ] 请求拦截器自动携带 Token
   - [ ] 响应拦截器处理 401
   - [ ] 基础 URL 正确配置

5. **UI 集成**
   - [ ] 导航栏显示登录/注册按钮 (未登录)
   - [ ] 导航栏显示用户信息 (已登录)
   - [ ] 表单样式与 shadcn/ui 一致
   - [ ] 响应式设计正常工作

**测试命令:**
```bash
# 1. 启动后端
pnpm --filter @bmad-starter-kit/api start:dev

# 2. 启动前端
pnpm --filter @bmad-starter-kit/web dev

# 3. 测试注册流程
# 访问 /register，填写表单，提交

# 4. 测试登录流程
# 访问 /login，填写表单，提交

# 5. 验证状态
# 检查 localStorage 中的 auth-storage
# 检查网络请求中的 Authorization header
```

### UX Requirements

**设计要求** (来源: `docs/planning-artifacts/ux-design-specification.md`):

1. **表单设计**
   - 使用 shadcn/ui Form 组件
   - 即时验证反馈 (<100ms)
   - 清晰的错误信息

2. **视觉反馈**
   - 加载状态 (提交按钮禁用 + spinner)
   - 成功提示 (toast 通知)
   - 错误提示 (inline 或 toast)

3. **响应式设计**
   - 移动端 < 640px: 单列布局
   - 桌面 > 1024px: 居中卡片布局

4. **导航流程**
   - 注册页面有"已有账号？去登录"链接
   - 登录页面有"没有账号？去注册"链接

### References

**架构文档引用:**
- 前端架构: [Source: docs/planning-artifacts/architecture.md#Project Structure & Boundaries]
- 认证架构: [Source: docs/planning-artifacts/architecture.md#Authentication & Security]
- API 端点: [Source: docs/planning-artifacts/architecture.md#API Design Patterns]

**Epic 文档引用:**
- Story 2.4 完整定义: [Source: docs/planning-artifacts/epics.md#Story 2.4]
- Epic 2 总览: [Source: docs/planning-artifacts/epics.md#Epic 2]

**UX 设计引用:**
- 设计系统: [Source: docs/planning-artifacts/ux-design-specification.md#设计系统基础]
- 表单模式: [Source: docs/planning-artifacts/ux-design-specification.md#UX一致性模式]

**前序 Story 文档:**
- Story 2.3 实现: [Source: docs/implementation-artifacts/2-3-jwt-auth-guard.md]
- Story 2.2 实现: [Source: docs/implementation-artifacts/2-2-user-login.md]
- Story 2.1 实现: [Source: docs/implementation-artifacts/2-1-user-registration.md]

**共享类型引用:**
- User: [Source: packages/shared/src/types/user.types.ts]
- RegisterDto: [Source: packages/shared/src/types/user.types.ts]
- LoginDto: [Source: packages/shared/src/types/user.types.ts]
- ApiResponse: [Source: packages/shared/src/types/api.types.ts]

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required during story creation.

### Completion Notes List

Story 实现完成，关键要点:

1. **完整的认证流程**: 注册 → 登录 → 状态管理 → API 调用

2. **Zustand 状态管理**: 使用 persist 中间件持久化用户信息，AccessToken 纯存储在内存 (页面刷新后需重新登录)

3. **axios 拦截器**: 请求拦截器从 Zustand store 读取 Token，响应拦截器处理 401 自动登出

4. **shadcn/ui 集成**: 使用 Card、Input、Button 等组件，保持设计一致

5. **路由守卫**: 在 App.tsx 中使用内联条件渲染实现路由守卫

6. **Header 集成**: 未登录显示登录/注册按钮，已登录显示用户信息和登出按钮

**实现详情**:
- 创建了 `apps/web/src/stores/auth.store.ts` - Zustand 认证状态管理
- 创建了 `apps/web/src/lib/api.ts` - axios API 客户端
- 创建了 `apps/web/src/pages/Login.tsx` 和 `Register.tsx` - 登录/注册页面
- 创建了 `apps/web/src/components/features/auth/LoginForm.tsx` 和 `RegisterForm.tsx` - 表单组件
- 更新了 `apps/web/src/App.tsx` - 添加路由配置和内联路由守卫
- 更新了 `apps/web/src/components/layout/Header.tsx` - 添加认证状态显示
- 创建了 `apps/web/.env.example` - 环境变量示例
- 安装了依赖: zustand, axios

**注意事项**:
- 登出功能已在前端实现 (clearAuth + 跳转)，但后端登出 API 在 Story 2.5 实现
- Access Token 纯存储在内存中 (Zustand store)，页面刷新后需重新登录
- 用户信息持久化在 localStorage，用于保持登录状态感知

### Code Review Fixes (2025-12-31)

代码审查中修复的问题:

1. **[HIGH] Token 存储策略修正**: 移除了 sessionStorage 使用，改为纯粹从 Zustand store 读取 accessToken，符合架构要求的"内存存储"策略

2. **[HIGH] API 响应结构修正**: LoginForm 已正确处理嵌套的响应数据结构 (response.data.data.accessToken)

3. **[HIGH] 移除未使用的组件**: 删除了 ProtectedRoute.tsx 组件，改用 App.tsx 中的内联条件渲染

4. **[HIGH] 撤销越界修改**: 回滚了 apps/api/src/main.ts 中的 CORS 配置修改 (本故事为前端故事，不应修改后端)

5. **[MEDIUM] API 客户端优化**: 请求/响应拦截器改为直接调用 Zustand store 的方法，而非直接操作 localStorage

### File List

**新增文件:**
- `apps/web/src/stores/auth.store.ts` - 认证状态管理
- `apps/web/src/lib/api.ts` - API 客户端配置
- `apps/web/src/pages/Login.tsx` - 登录页面
- `apps/web/src/pages/Register.tsx` - 注册页面
- `apps/web/src/components/features/auth/LoginForm.tsx` - 登录表单组件
- `apps/web/src/components/features/auth/RegisterForm.tsx` - 注册表单组件
- `apps/web/.env.example` - 环境变量示例

**修改文件:**
- `apps/web/src/App.tsx` - 添加登录/注册路由和内联路由守卫
- `apps/web/src/components/layout/Header.tsx` - 添加登录状态显示和登出功能
- `apps/web/package.json` - 添加 zustand, axios 依赖

**参考文件:**
- `packages/shared/src/types/user.types.ts` - 共享类型定义
- `packages/shared/src/types/api.types.ts` - API 响应类型
- `apps/api/src/modules/auth/auth.controller.ts` - 后端认证端点
