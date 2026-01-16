# Story 1.4: 创建共享类型包

Status: done

## Story

作为 开发者,
我想要 创建 packages/shared 共享类型包,
以便 前后端可以共享 TypeScript 类型定义,确保类型一致性.

## Acceptance Criteria

**Given** Monorepo 结构已初始化 (Story 1.1 完成)
**When** 创建共享类型包
**Then** 创建 `packages/shared/` 目录
**And** 创建 `packages/shared/src/types/` 目录
**And** 创建 `packages/shared/src/index.ts` 作为导出入口
**And** `packages/shared/package.json` 的 `name` 字段为 `@bmad-starter-kit/shared`
**And** 配置 TypeScript 构建输出为 ESM 格式
**And** 定义基础类型：`User`
**And** 定义 API 响应类型：`ApiResponse<T>`、`ApiError`
**And** 在 `apps/web` 和 `apps/api` 中可以成功导入 `@bmad-starter-kit/shared`

## Tasks / Subtasks

- [x] 1. 创建 packages/shared 目录结构 (AC: #1, #2)
  - [x] 1.1 创建 `packages/shared/src/` 主目录
  - [x] 1.2 创建 `packages/shared/src/types/` 类型目录

- [x] 2. 创建 packages/shared/package.json (AC: #4, #6)
  - [x] 2.1 设置 name 字段为 `@bmad-starter-kit/shared`
  - [x] 2.2 配置 `type: "module"` (ESM 输出)
  - [x] 2.3 配置 `main` 和 `exports` 字段

- [x] 3. 创建 TypeScript 配置文件
  - [x] 3.1 创建 `packages/shared/tsconfig.json`
  - [x] 3.2 配置 ESM 输出格式

- [x] 4. 定义核心类型 (AC: #7)
  - [x] 4.1 创建 `types/user.types.ts` (User, CreateUserDto, LoginDto)
  - [x] 4.2 创建 `types/admin.types.ts` (SystemStats, UsersListResponse)
  - [x] 4.3 创建 `types/api.types.ts` (ApiResponse, ApiError, Pagination)

- [x] 5. 创建导出入口 (AC: #3, #8)
  - [x] 5.1 创建 `src/index.ts` 统一导出所有类型
  - [x] 5.2 配置 `package.json` 的 exports 字段

## Dev Notes

### Epic Context

**Epic 1 目标**: 搭建开发环境,创建 Monorepo 结构

**本 Story 的重要性:**
共享类型包是 Monorepo 架构的核心价值所在。它确保前后端使用相同的数据类型定义,避免了类型不一致导致的运行时错误。

**后续 Story 依赖:**
- Epic 2 (用户认证) 将使用 User 类型
- Epic 7 (系统管理) 将使用 Admin 类型

### Architecture Compliance

**Monorepo 类型共享策略**

```
bmad-starter-kit/
├── packages/
│   └── shared/              # 共享类型和工具
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.types.ts
│       │   │   ├── admin.types.ts
│       │   │   └── api.types.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
```

### Technical Requirements

**package.json 结构:**

```json
{
  "name": "@bmad-starter-kit/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.1.3"
  }
}
```

**核心类型定义要求:**

```typescript
// types/user.types.ts
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
}

// types/admin.types.ts
export interface SystemStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface UsersListResponse {
  data: UserListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// types/api.types.ts
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
```

### File Structure Requirements

**目标目录结构:**

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.types.ts
│   │   ├── admin.types.ts
│   │   └── api.types.ts
│   ├── constants.ts
│   └── index.ts
├── dist/
├── package.json
└── tsconfig.json
```

### Known Issues & Solutions

**问题 1: TypeScript 构建产物路径**

- 症状: 导入 `@bmad-starter-kit/shared` 时找不到类型声明
- 解决:
  1. 确保 `tsconfig.json` 中 `declaration: true`
  2. 确保 `package.json` 中 `types` 字段指向正确路径

**问题 2: Monorepo 中路径解析**

- 症状: `import { User } from '@bmad-starter-kit/shared'` 找不到模块
- 解决:
  1. 在根目录执行 `pnpm install`
  2. 确保 `pnpm-workspace.yaml` 正确配置
  3. 确保 shared 包已构建

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **在 shared 包中添加运行时依赖**
   - shared 包应该是纯类型包

2. **使用 CJS 格式**
   - 项目统一使用 ESM

**✅ 正确做法:**

1. 只包含 TypeScript 类型定义和接口
2. 使用 ESM 格式,`type: "module"`
3. 配置 `declaration: true` 生成类型声明

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Completion Notes List

**完成日期:** 2025-01-16

**实现摘要:**
1. 创建了 `packages/shared/` 目录结构
2. 配置了 `package.json`,使用 `@bmad-starter-kit/shared` 包名
3. 定义了核心类型:
   - `User`, `CreateUserDto`, `LoginDto`, `UserRole` (user.types.ts)
   - `SystemStats`, `UserListItem`, `UsersListResponse` (admin.types.ts)
   - `ApiResponse<T>`, `ApiError` (api.types.ts)
4. 创建了统一的导出入口 `src/index.ts`
5. 在 `apps/web` 和 `apps/api` 中添加了依赖

### File List

**新增文件:**
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/types/user.types.ts`
- `packages/shared/src/types/admin.types.ts`
- `packages/shared/src/types/api.types.ts`
- `packages/shared/src/constants.ts`
