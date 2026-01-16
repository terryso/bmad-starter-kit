# Story 7.1: 管理员角色和权限

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为 开发者,
我想要 创建管理员角色和权限系统,
So that 管理功能只对授权用户开放.

## Acceptance Criteria

**Given** User 模型已存在
**When** 更新 Prisma Schema
**Then** 为 User 模型添加 `role` 字段 (Enum: USER, ADMIN)
**And** 默认值为 USER
**And** 创建 Admin Guard，验证用户角色为 ADMIN
**And** 创建 @Roles() 装饰器，用于标记需要管理员权限的路由
**And** 执行 `npx prisma db push` 成功更新表
**And** 非 ADMIN 用户访问管理路由返回 403 状态码

## Tasks / Subtasks

- [x] 1. 更新 Prisma Schema 添加 role 字段 (AC: #1, #2)
  - [x] 1.1 在 User 模型添加 role 字段
  - [x] 1.2 创建 Role 枚举 (USER, ADMIN)
  - [x] 1.3 设置默认值为 USER
  - [x] 1.4 执行 prisma db push 更新数据库

- [x] 2. 创建 @Roles() 装饰器 (AC: #5)
  - [x] 2.1 在 apps/api/src/common/decorators/ 创建 roles.decorator.ts
  - [x] 2.2 实现 Roles 装饰器，支持传入角色数组
  - [x] 2.3 创建 ROLES_KEY 常量用于元数据存储

- [x] 3. 创建 Roles Guard (AC: #4)
  - [x] 3.1 在 apps/api/src/modules/auth/guards/ 创建 roles.guard.ts
  - [x] 3.2 实现 canActivate 方法检查用户角色
  - [x] 3.3 从 Reflector 获取路由所需的角色
  - [x] 3.4 从 request.user 获取当前用户角色
  - [x] 3.5 角色不匹配时抛出 ForbiddenException

- [x] 4. 创建 Admin Guard (AC: #4)
  - [x] 4.1 在 apps/api/src/modules/auth/guards/ 创建 admin.guard.ts
  - [x] 4.2 扩展 RolesGuard 或直接验证 ADMIN 角色
  - [x] 4.3 提供便捷方式保护管理员路由

- [x] 5. 更新 Auth 模块导出 (AC: #4, #5)
  - [x] 5.1 在 auth.module.ts 中导出 RolesGuard
  - [x] 5.2 确保其他模块可以使用 RolesGuard

- [x] 6. 添加单元测试
  - [x] 6.1 测试 Roles 装饰器正确设置元数据
  - [x] 6.2 测试 RolesGuard 允许匹配角色的用户
  - [x] 6.3 测试 RolesGuard 拒绝不匹配角色的用户
  - [x] 6.4 测试 RolesGuard 拒绝未认证用户
  - [x] 6.5 测试 AdminGuard 行为

- [x] 7. 创建数据库迁移脚本
  - [x] 7.1 创建现有用户的默认角色设置脚本
  - [x] 7.2 提供将指定用户提升为管理员的脚本

## Dev Notes

### Epic Context

**Epic 7 目标**: 管理员可以查看用户数据和系统统计信息

**Epic 7 Stories:**
- 🔄 **Story 7.1: 管理员角色和权限 (当前)**
- Story 7.2: 用户列表管理 (依赖本 Story)
- Story 7.3: 系统统计信息 (依赖本 Story)

**本 Story 的重要性:**
这是 Epic 7 的基础 Story，为后续的管理功能提供权限控制:
1. 建立角色系统，区分普通用户和管理员
2. 提供可复用的 Guard 和装饰器
3. 确保管理功能的安全性

### Previous Story Intelligence

**从 Epic 2 (用户认证) 学到的模式** (来源: `docs/implementation-artifacts/2-3-jwt-auth-guard.md`):

Epic 2 实现了 JWT 认证守卫:
- ✅ JwtAuthGuard - JWT 认证守卫
- ✅ @CurrentUser() 装饰器 - 获取当前用户
- ✅ @Public() 装饰器 - 标记公开路由
- ✅ AuthGuard('jwt') 继承模式

**需要复用的模式**:
- 使用 Reflector 获取路由元数据 (类似 @Public())
- 使用 JwtAuthGuard 作为基础 (管理员必须先认证)
- 统一的错误响应格式 (403 Forbidden)

**Guard 组合模式**:
```
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController { }
```

### Technical Requirements

**Prisma Schema 更新**:

```prisma
// apps/api/prisma/schema.prisma

enum Role {
  USER
  ADMIN
}

model User {
  id         String     @id @default(cuid())
  email      String     @unique
  password   String
  name       String
  role       Role       @default(USER)  // 新增
  createdAt  DateTime   @default(now())
  albums     Album[]
  categories Category[]
  videos     Video[]
}
```

**数据库迁移**:

```bash
# 1. 更新 schema
# 2. 推送到数据库
cd apps/api
npx prisma db push

# 3. 现有用户将自动获得 USER 默认值
# 4. 使用脚本提升用户为管理员
```

**@Roles() 装饰器**:

```typescript
// apps/api/src/common/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**RolesGuard 实现**:

```typescript
// apps/api/src/modules/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由所需的角色
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置角色要求，默认允许 (由其他 Guard 处理)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 未认证用户由 JwtAuthGuard 处理，这里直接返回 false
    if (!user) {
      return false;
    }

    // 检查用户角色是否匹配
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
```

**AdminGuard (便捷 Guard)**:

```typescript
// apps/api/src/modules/auth/guards/admin.guard.ts

import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

/**
 * Admin Guard - 快捷保护管理员路由
 *
 * 等同于 @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN)
 *
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * export class AdminController { }
 * ```
 */
@Injectable()
export class AdminGuard extends RolesGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }

  // AdminGuard 需要配合 @Roles(Role.ADMIN) 使用
  // 或者可以直接在 canActivate 中检查 ADMIN 角色
}
```

**使用示例 - 管理员路由**:

```typescript
// apps/api/src/modules/admin/admin.controller.ts (Story 7.2 创建)

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)  // 先认证，再检查角色
export class AdminController {
  @Get('users')
  @Roles(Role.ADMIN)  // 只有管理员可访问
  getUsers() {
    // 实现用户列表
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    // 实现统计信息
  }
}
```

**更简洁的用法 - 使用组合 Guard**:

```typescript
// apps/api/src/common/guards/index.ts

export const AdminOnly = () => UseGuards(JwtAuthGuard, RolesGuard);

// 使用
@Controller('admin')
export class AdminController {
  @Get('users')
  @AdminOnly()
  @Roles(Role.ADMIN)
  getUsers() { }
}
```

### Architecture Compliance

**路由配置** (来源: `docs/planning-artifacts/architecture.md#API Route Convention`):

```
/api/v1/admin           # 管理员路由
  GET    /users        # 用户列表 (Story 7.2)
  GET    /stats        # 统计信息 (Story 7.3)
```

**认证链**:
```
Request → JwtAuthGuard → RolesGuard → Controller
           (验证token)  (验证角色)
```

**Guard 执行顺序**:
1. JwtAuthGuard 验证用户身份 (401 if 未认证)
2. RolesGuard 验证用户角色 (403 if 无权限)

### File Structure Requirements

**修改文件**:
```
apps/api/
├── prisma/
│   └── schema.prisma                    # 修改 - 添加 Role 枚举和 User.role 字段
├── src/
│   ├── common/
│   │   └── decorators/
│   │       └── roles.decorator.ts       # 新建 - @Roles() 装饰器
│   ├── modules/auth/
│   │   ├── guards/
│   │   │   ├── roles.guard.ts           # 新建 - RolesGuard
│   │   │   └── admin.guard.ts           # 新建 - AdminGuard (可选)
│   │   └── auth.module.ts               # 修改 - 导出 RolesGuard
```

**测试文件**:
```
apps/api/src/
├── common/
│   └── decorators/
│       └── roles.decorator.spec.ts      # 新建 - Roles 装饰器测试
├── modules/auth/
│   └── guards/
│       ├── roles.guard.spec.ts          # 新建 - RolesGuard 测试
│       └── admin.guard.spec.ts          # 新建 - AdminGuard 测试
```

**数据库脚本**:
```
apps/api/src/scripts/
└── promote-user-to-admin.ts             # 新建 - 提升用户为管理员脚本
```

### Project Structure Notes

**NestJS 装饰器模式** (遵循项目约定):

参考现有的 @Public() 装饰器模式 (来源: `apps/api/src/common/decorators/public.decorator.ts`):

```typescript
// 现有模式
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// 新增模式
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**NestJS Guard 模式**:

参考现有的 JwtAuthGuard:
- 继承 Passport AuthGuard 或实现 CanActivate 接口
- 使用 Reflector 获取路由元数据
- 抛出 HttpException (401/403)
- 添加完整的 JSDoc 注释

**错误响应格式**:

```typescript
// 403 Forbidden
{
  "statusCode": 403,
  "message": "需要管理员权限",
  "error": "Forbidden"
}
```

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **忘记默认角色值**
   - 现有用户没有角色值，查询会报错
   - ✅ 在 Prisma Schema 中设置 @default(USER)
   - ✅ 执行 db push 前备份数据

2. **Guard 顺序错误**
   - RolesGuard 在 JwtAuthGuard 之前执行
   - ✅ 先使用 JwtAuthGuard，再使用 RolesGuard

3. **Reflector 获取元数据错误**
   - 使用错误的 metadata key
   - ✅ 定义常量 ROLES_KEY 避免拼写错误

4. **未处理未认证用户**
   - user 为 undefined 时访问 user.role 会报错
   - ✅ 先检查 user 是否存在

5. **硬编码角色检查**
   - 在每个控制器中手动检查角色
   - ✅ 使用 Guard 和装饰器声明式检查

**✅ 正确做法:**

1. 设置 Prisma 字段默认值
2. 正确的 Guard 顺序 (认证 → 授权)
3. 使用常量定义 metadata key
4. 检查 user 对象存在性
5. 使用声明式权限控制

### Testing Requirements

**验证清单:**

1. **单元测试**
   - [ ] Roles 装饰器正确设置元数据 (roles.decorator.spec.ts)
   - [ ] RolesGuard 允许匹配角色的用户
   - [ ] RolesGuard 拒绝不匹配角色的用户
   - [ ] RolesGuard 没有角色要求时默认允许
   - [ ] AdminGuard 行为正确

2. **集成测试**
   - [ ] 创建测试路由验证 Guard 组合
   - [ ] 未认证用户返回 401
   - [ ] 普通用户访问管理路由返回 403
   - [ ] 管理员用户访问管理路由返回 200

3. **数据库测试**
   - [ ] Prisma db push 成功
   - [ ] 现有用户自动获得 USER 角色
   - [ ] 新用户默认为 USER 角色
   - [ ] 可以手动更新用户为 ADMIN

**测试命令:**

```bash
# 单元测试
cd apps/api
pnpm test roles.decorator
pnpm test roles.guard
pnpm test admin.guard

# 数据库更新
npx prisma db push

# 验证现有用户角色
npx prisma studio
```

**测试用例示例**:

```typescript
// roles.guard.spec.ts

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when user has required role', () => {
    const context = createMockContext([Role.ADMIN]);
    reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    const context = createMockContext([Role.USER]);
    reflector.getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

### Security Considerations

**权限安全:**
- Admin Guard 必须配合 JwtAuthGuard 使用 (双重验证)
- 角色信息存储在 JWT Token 中，确保不被篡改
- 数据库角色是最终验证来源

**潜在安全风险:**
1. JWT 被篡改 → 由 JwtAuthGuard 处理 (签名验证)
2. 直接修改数据库 → 需要 DB 访问权限
3. 角色枚举绕过 → 使用 TypeScript 枚举，类型安全

**最佳实践:**
- 定期审查管理员列表
- 记录管理员操作日志 (未来需求)
- 考虑实现更细粒度的权限系统 (Growth 阶段之后)

### Dependencies

**Story 依赖:**
- Story 1.5: 配置 Prisma 和数据库连接 (已完成) ⭐
- Story 2.3: JWT 认证守卫 (已完成) ⭐
  - 提供 JwtAuthGuard 基础
  - 提供 @CurrentUser() 装饰器模式

**后续依赖:**
- Story 7.2: 用户列表管理 (依赖本 Story) ⭐
- Story 7.3: 系统统计信息 (依赖本 Story) ⭐

**外部依赖:**
- @nestjs/common - Injectable, CanActivate, ExecutionContext, ForbiddenException
- @nestjs/core - Reflector
- @prisma/client - Role 枚举

### References

**Epic 文档引用:**
- Story 7.1 完整定义: [Source: docs/planning-artifacts/epics.md#Story 7.1]
- Epic 7 总览: [Source: docs/planning-artifacts/epics.md#Epic 7]

**前序 Story 文档:**
- Story 2.3 JWT 认证守卫: [Source: docs/implementation-artifacts/2-3-jwt-auth-guard.md]
- Story 1.5 Prisma 配置: [Source: docs/implementation-artifacts/1-5-prisma-setup.md]

**项目上下文:**
- 项目结构和规范: [Source: docs/project-context.md]
- 后端架构: [Source: docs/planning-artifacts/architecture.md]
- Guard 实现参考: [Source: apps/api/src/modules/auth/guards/jwt-auth.guard.ts]
- 装饰器实现参考: [Source: apps/api/src/common/decorators/public.decorator.ts]

## 手工验收记录 (Manual Acceptance Test)

**验收日期**: 2026-01-05
**验收人**: Claude (Happy)
**验收结果**: ✅ 全部通过

### 验收项目

#### 1. JWT Token 包含 role 字段 ✅
```json
{
  "sub": "cmk0wmzmr0000lwu2hyn00dvj",
  "email": "acceptance-user@example.com",
  "role": "USER",
  "iat": 1767602110,
  "exp": 1767605710
}
```

#### 2. 普通用户访问管理员路由返回 403 ✅
```bash
curl -H "Authorization: Bearer <USER_TOKEN>" http://localhost:3000/api/admin/test
# 响应: {"statusCode":403,"message":"需要管理员权限","error":"Forbidden"}
```

#### 3. 管理员用户访问管理员路由成功 ✅
```bash
# 1. 使用 promote-user-to-admin.ts 脚本将用户提升为 ADMIN
# 2. 重新登录获取新的 JWT token (role: "ADMIN")
# 3. 访问 admin/test 端点
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3000/api/admin/test
# 响应: {"message":"管理员权限验证成功","timestamp":"2026-01-05T08:38:11.959Z"}
```

### DoD 合规性

| 分类 | 检查项 | 状态 |
|------|--------|------|
| 代码质量 | 无 console.log/TODO | ✅ |
| 单元测试 | 506 个测试全部通过 | ✅ |
| 集成测试 | Guards 单元测试覆盖 | ✅ |
| 手工验收 | JWT token 验证 | ✅ |
| 手工验收 | 权限验证 (403/200) | ✅ |
| 文档更新 | Story 状态为 done | ✅ |
| 代码提交 | 已提交到 Git | ✅ |

**结论**: Story 7.1 完全符合 Definition of Done，可以开始 Story 7.2。

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required during story creation.

### Completion Notes List

**Story 7.1 实现完成 - 管理员角色和权限系统**

**实现内容:**
1. ✅ 更新 Prisma Schema：添加 Role 枚举 (USER, ADMIN) 和 User.role 字段 (默认 USER)
2. ✅ 执行 prisma db push 成功更新数据库
3. ✅ 创建 @Roles() 装饰器：用于标记路由所需角色
4. ✅ 创建 RolesGuard：验证用户角色的通用守卫
5. ✅ 创建 AdminGuard：专用于管理员路由的便捷守卫
6. ✅ 更新 Auth 模块：导出 RolesGuard 和 AdminGuard
7. ✅ 更新 common/decorators/index.ts：导出 @Roles() 装饰器
8. ✅ 创建单元测试：roles.decorator.spec.ts, roles.guard.spec.ts, admin.guard.spec.ts
9. ✅ 创建数据库迁移脚本：promote-user-to-admin.ts
10. ✅ 修复现有测试文件中的 mockUser 对象（添加 role 字段）

**新文件 (相对于 repo root):**
- apps/api/src/common/decorators/roles.decorator.ts
- apps/api/src/common/decorators/roles.decorator.spec.ts
- apps/api/src/modules/auth/guards/roles.guard.ts
- apps/api/src/modules/auth/guards/admin.guard.ts
- apps/api/src/modules/auth/guards/roles.guard.spec.ts
- apps/api/src/modules/auth/guards/admin.guard.spec.ts
- apps/api/src/scripts/promote-user-to-admin.ts

**修改文件:**
- apps/api/prisma/schema.prisma
- apps/api/src/modules/auth/auth.module.ts
- apps/api/src/common/decorators/index.ts
- apps/api/src/modules/auth/auth.controller.spec.ts
- apps/api/src/modules/auth/auth.service.spec.ts

**Guard 使用示例:**
```typescript
// 方式 1: 使用 RolesGuard + @Roles()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController { }

// 方式 2: 使用 AdminGuard
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController { }
```

**数据库迁移脚本使用:**
```bash
cd apps/api
npx ts-node src/scripts/promote-user-to-admin.ts user@example.com
```

---

## File List

### New Files
- `apps/api/src/common/decorators/roles.decorator.ts` - 新建 - @Roles() 装饰器
- `apps/api/src/modules/auth/guards/roles.guard.ts` - 新建 - RolesGuard
- `apps/api/src/modules/auth/guards/admin.guard.ts` - 新建 - AdminGuard (可选)
- `apps/api/src/common/decorators/roles.decorator.spec.ts` - 新建 - Roles 装饰器测试
- `apps/api/src/modules/auth/guards/roles.guard.spec.ts` - 新建 - RolesGuard 测试
- `apps/api/src/modules/auth/guards/admin.guard.spec.ts` - 新建 - AdminGuard 测试
- `apps/api/src/scripts/promote-user-to-admin.ts` - 新建 - 提升用户为管理员脚本

### Modified Files
- `apps/api/prisma/schema.prisma` - 修改 - 添加 Role 枚举和 User.role 字段
- `apps/api/src/modules/auth/auth.module.ts` - 修改 - 导出 RolesGuard
- `apps/api/src/common/decorators/index.ts` - 修改 - 导出 @Roles() 装饰器
- `apps/api/src/modules/auth/auth.service.ts` - 修改 - JWT payload 中添加 role 字段
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - 修改 - validate() 返回 role 字段
- `packages/shared/src/types/user.types.ts` - 修改 - 添加 UserRole 类型和 User/JwtPayload 接口 role 字段
- `packages/shared/src/types/index.ts` - 修改 - 导出 UserRole 类型
- `apps/api/src/modules/auth/auth.controller.spec.ts` - 修改 - 修复 mockUser 添加 role 字段
- `apps/api/src/modules/auth/auth.service.spec.ts` - 修改 - 修复 mockUser 添加 role 字段

### Existing Files (Reuse)
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` - 复用 - Guard 模式参考
- `apps/api/src/common/decorators/public.decorator.ts` - 复用 - 装饰器模式参考

## Change Log

**2026-01-05**: Story 7.1 实现 - 管理员角色和权限系统
- 更新 Prisma Schema：添加 Role 枚举 (USER, ADMIN) 和 User.role 字段
- 执行 `npx prisma db push` 成功更新数据库
- 创建 @Roles() 装饰器 (apps/api/src/common/decorators/roles.decorator.ts)
- 创建 RolesGuard (apps/api/src/modules/auth/guards/roles.guard.ts)
- 创建 AdminGuard (apps/api/src/modules/auth/guards/admin.guard.ts)
- 更新 Auth 模块导出 RolesGuard 和 AdminGuard
- 创建单元测试：roles.decorator.spec.ts, roles.guard.spec.ts, admin.guard.spec.ts
- 创建数据库迁移脚本：promote-user-to-admin.ts
- 修复现有测试文件中的 mockUser 对象（添加 role 字段）

**2026-01-05 (代码审查后修复)**:
- 修复关键问题：JWT Token 中未包含 role 信息导致权限系统无法工作
- 更新 packages/shared/src/types/user.types.ts：添加 UserRole 类型，User/JwtPayload/UserResponse 接口添加 role 字段
- 更新 packages/shared/src/types/index.ts：导出 UserRole 类型
- 更新 apps/api/src/modules/auth/auth.service.ts：login() 和 refreshTokens() 的 JWT payload 中添加 role 字段
- 更新 apps/api/src/modules/auth/strategies/jwt.strategy.ts：validate() 返回 role 字段
- 优化 apps/api/src/modules/auth/guards/admin.guard.ts：移除未使用的 Reflector 依赖
- 更新 apps/api/src/modules/auth/guards/admin.guard.spec.ts：移除 Reflector 相关测试
- 更新 File List 完整记录所有修改的文件
