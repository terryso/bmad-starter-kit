# Architecture Decision Document - bmad-starter-kit

**Author:** BMAD Learning Project
**Date:** 2025-01-16

---

## Project Context

这是一个使用 BMAD 框架开发的全栈学习项目，展示了完整的用户认证系统实现。

### Requirements Overview

| Category | Count | Architectural Implications |
|----------|-------|---------------------------|
| 用户管理 | 4 | 需要用户模型、密码加密 |
| 认证授权 | 3 | 需要JWT机制、权限中间件 |
| 系统管理 | 2 | 需要管理员角色、统计数据聚合 |

### Scale & Complexity

- **Complexity Level:** 低（学习项目）
- **Estimated Components:** 3 个主要模块
- **Target Scale:** 学习演示

---

## Technology Stack

| 组件 | 技术选择 | 版本 |
|------|----------|------|
| **前端** | React + Vite + shadcn/ui | 18.x / 5.x |
| **后端** | NestJS + Prisma | 10.x / 6.x |
| **认证** | JWT | @nestjs/jwt |
| **密码加密** | bcrypt | 6.x |
| **数据库** | PostgreSQL | 15+ |

---

## Architecture Decisions

### 1. Authentication & Security

| 决策 | 方案 | 版本 |
|------|------|------|
| **认证方式** | JWT (Access + Refresh Token) | @nestjs/jwt |
| **密码加密** | bcrypt | bcrypt |
| **Cookie 安全** | HttpOnly + Secure | - |

**Token 策略:**
```
Access Token:  15分钟有效期
Refresh Token:  7天有效期
```

### 2. API Design

| 决策 | 方案 | 说明 |
|------|------|------|
| **API 风格** | REST | RESTful API |
| **API 版本** | URL 路径版本 | `/api/v1/...` |
| **响应格式** | 统一 JSON | { statusCode, message, data } |

**API 路由结构:**
```
/api/v1/auth           # 认证相关
  POST   /register     # 注册
  POST   /login        # 登录
  POST   /logout       # 登出
  POST   /refresh      # 刷新 token

/api/v1/users          # 用户管理
  GET    /             # 当前用户信息
  PUT    /             # 更新资料

/api/v1/admin          # 管理员功能
  GET    /stats        # 系统统计
  GET    /users        # 用户列表
```

### 3. Data Architecture

| 决策 | 方案 | 说明 |
|------|------|------|
| **ORM** | Prisma | 类型安全 |
| **数据库** | PostgreSQL | 开源关系型 |

**Prisma Schema:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

---

## Project Structure

```
bmad-starter-kit/
├── apps/
│   ├── api/            # NestJS 后端
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # 认证模块
│   │   │   │   ├── users/       # 用户模块
│   │   │   │   └── admin/       # 管理模块
│   │   │   ├── common/          # 公共模块
│   │   │   └── prisma/          # Prisma 配置
│   │   └── prisma/
│   │       └── schema.prisma    # 数据库 Schema
│   └── web/            # React 前端
│       └── src/
│           ├── components/
│           │   ├── features/auth/   # 认证组件
│           │   ├── layout/          # 布局组件
│           │   └── admin/           # 管理组件
│           ├── pages/
│           │   ├── Login.tsx        # 登录页
│           │   ├── Register.tsx     # 注册页
│           │   └── admin/           # 管理页面
│           ├── lib/
│           │   └── api.ts           # API 客户端
│           └── stores/
│               └── auth.store.ts    # 认证状态
└── packages/
    └── shared/         # 共享类型
        └── src/
            └── types/   # TypeScript 类型
```

---

## Implementation Patterns

### Naming Conventions

- **Database:** PascalCase 模型, camelCase 字段
- **API:** 复数资源名, kebab-case 路由
- **Code:** PascalCase 类/接口, camelCase 变量/函数

### API Response Format

```typescript
// 成功响应
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}

// 错误响应
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Security Considerations

1. **密码存储:** 使用 bcrypt 单向加密，salt rounds = 10
2. **Token 存储:** Access Token 内存存储，Refresh Token HttpOnly Cookie
3. **API 通信:** 全程 HTTPS
4. **输入验证:** 后端 class-validator + 前端 Zod 双重验证
5. **限流保护:** 登录/注册接口 10 次/分钟

---

## Deployment Considerations

### Environment Variables

```bash
# 后端
DATABASE_URL=      # PostgreSQL 连接字符串
JWT_SECRET=        # JWT 签名密钥
REFRESH_SECRET=    # Refresh Token 密钥

# 前端
VITE_API_URL=      # API 基础 URL
```
