# Epic 分解 - bmad-starter-kit

**Author:** BMAD Learning Project
**Date:** 2025-01-16

---

## Epic 1: 基础设施搭建

### 目标
搭建 Monorepo 项目结构和开发环境。

### Stories

#### Story 1.1: 初始化 Monorepo
- [x] 初始化 pnpm workspace
- [x] 创建项目目录结构
- [x] 配置 Turbo (可选)

#### Story 1.4: 共享类型定义
- [x] 创建 packages/shared-types
- [x] 定义通用类型
- [x] 配置 TypeScript 编译

#### Story 1.5: Prisma ORM 配置
- [x] 安装 Prisma
- [x] 配置数据库连接
- [x] 初始化 Prisma Schema
- [x] 配置迁移

### 验收标准
- [x] `pnpm install` 成功安装所有依赖
- [x] `pnpm --filter api dev` 可以启动后端
- [x] `pnpm --filter web dev` 可以启动前端

---

## Epic 2: 用户认证与账户管理

### 目标
实现完整的用户注册、登录和认证系统。

### Stories

#### Story 2.1: 用户注册
- [x] 注册 API 端点（POST /api/v1/auth/register）
- [x] 邮箱格式验证
- [x] 密码强度验证（8位以上，包含大小写字母和数字）
- [x] 密码 bcrypt 加密存储
- [x] 注册表单组件
- [x] 注册成功后自动登录

#### Story 2.2: 用户登录
- [x] 登录 API 端点（POST /api/v1/auth/login）
- [x] JWT Token 生成（Access + Refresh）
- [x] 登录表单组件
- [x] 登录状态管理（Zustand）
- [x] Token 自动刷新机制

#### Story 2.3: JWT 认证守卫
- [x] JWT 认证守卫
- [x] 受保护路由组件
- [x] 自动跳转登录页

#### Story 2.4: 认证 UI 集成
- [x] 登录/注册页面 UI
- [x] 导航栏集成
- [x] 登录状态显示

#### Story 2.5: 用户登出
- [x] 登出 API 端点
- [x] 前端登出功能
- [x] 清除本地 Token

#### Story 2.6: 用户资料管理
- [x] 资料更新 API
- [x] 资料编辑页面
- [x] 表单验证

### 验收标准
- [x] 用户可以注册新账号
- [x] 用户可以登录系统
- [x] 未登录用户无法访问受保护页面
- [x] Token 过期后自动刷新

---

## Epic 7: 系统管理

### 目标
实现管理员仪表盘和用户管理功能。

### Stories

#### Story 7.1: 管理员角色和权限
- [x] Prisma Schema 添加 role 字段
- [x] 创建 Role 枚举 (USER, ADMIN)
- [x] 创建 Admin Guard
- [x] 创建 @Roles() 装饰器
- [x] 非 ADMIN 用户访问返回 403

#### Story 7.2: 用户列表管理
- [x] 用户列表 API（GET /api/v1/admin/users）
- [x] 分页功能
- [x] 邮箱搜索功能
- [x] 角色筛选功能
- [x] 用户列表页面

#### Story 7.3: 系统统计信息
- [x] 统计 API 端点（GET /api/v1/admin/stats）
- [x] 总用户数统计
- [x] 今日新用户统计
- [x] 本月新用户统计
- [x] 统计卡片组件

### 验收标准
- [x] 管理员可以查看系统统计
- [x] 管理员可以查看所有用户
- [x] 支持分页和搜索
- [x] 普通用户无法访问管理页面
