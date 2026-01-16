# Product Requirements Document - bmad-starter-kit

**Author:** BMAD Learning Project
**Date:** 2025-01-16

---

## Executive Summary

### Product Vision

**bmad-starter-kit** 是一个用户认证与管理系统基础模板，展示了如何使用 BMAD 框架构建全栈应用。

**核心价值:** 为学习 BMAD 开发流程提供一个精简但完整的示例项目。

### Target Users

- **BMAD 学习者**: 想要了解如何使用 BMAD 进行全栈开发的开发者
- **全栈开发者**: 需要一个认证系统起点的开发者

### Core Features

1. **用户认证系统**
   - 用户注册（邮箱 + 密码）
   - 用户登录
   - JWT 认证（Access Token + Refresh Token）
   - 自动 Token 刷新
   - 角色管理（USER/ADMIN）

2. **管理员仪表盘**
   - 用户统计（总用户数、今日新用户、本月新用户）
   - 用户列表管理（分页、搜索、角色筛选）

---

## Success Criteria

### User Success

| 指标 | 描述 | 成功标准 |
|------|------|----------|
| **注册成功率** | 用户能顺利完成注册 | 100% |
| **登录成功率** | 用户能成功登录系统 | 100% |
| **Token 刷新** | Access Token 过期后自动刷新 | 无感知 |
| **权限控制** | 普通用户无法访问管理员功能 | 100% |

---

## Product Scope

### MVP Features

1. **用户系统**
   - 注册/登录（邮箱 + 密码）
   - 基础资料管理

2. **认证系统**
   - JWT 认证
   - 角色权限（USER/ADMIN）

3. **管理功能**
   - 用户统计
   - 用户列表

---

## User Journeys

### Journey 1: 新用户注册

**步骤:**
1. 访问 /register 页面
2. 填写邮箱、密码、姓名
3. 提交表单
4. 自动登录并跳转仪表盘

### Journey 2: 用户登录

**步骤:**
1. 访问 /login 页面
2. 输入邮箱和密码
3. 提交表单
4. 跳转仪表盘

### Journey 3: 管理员查看统计

**步骤:**
1. 以管理员身份登录
2. 访问 /admin
3. 查看用户统计数据
4. 访问 /admin/users 查看用户列表

---

## Technical Stack

- **前端**: React + Vite + shadcn/ui
- **后端**: NestJS + Prisma
- **数据库**: PostgreSQL
- **认证**: JWT (Access + Refresh Token)

---

## Functional Requirements

### 用户管理

- **FR1:** 用户可以注册新账号
- **FR2:** 系统可以验证用户注册信息（邮箱格式、密码强度）
- **FR3:** 用户可以登录系统
- **FR4:** 用户可以退出登录

### 认证与授权

- **FR5:** 系统可以维护用户会话状态
- **FR6:** 系统可以验证用户权限（区分已登录/未登录）
- **FR7:** 系统可以区分用户角色（USER/ADMIN）

### 系统管理

- **FR8:** 管理员可以查看所有注册用户
- **FR9:** 管理员可以查看系统统计信息
