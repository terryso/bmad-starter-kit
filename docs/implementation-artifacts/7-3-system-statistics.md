# Story 7.3: 系统统计信息

Status: done

## Story

作为 管理员,
我想要 查看系统统计数据,
So that 我可以监控平台用户状态.

## Acceptance Criteria

**Given** 用户已登录且角色为 ADMIN
**When** 访问管理仪表盘
**Then** 调用 GET /api/v1/admin/stats 接口
**And** 返回统计数据：
  - 总用户数
  - 今日新增用户数
  - 本月新增用户数
**And** 数据以 JSON 格式返回
**And** 前端以卡片形式展示各项指标
**And** 数据实时计算 (每次请求时聚合)
**And** 非 ADMIN 用户访问返回 403 状态码

## Tasks / Subtasks

- [x] 1. 实现统计 DTO (AC: #7)
  - [x] 1.1 创建 stats-response.dto.ts
  - [x] 1.2 定义用户统计指标字段

- [x] 2. 实现 Admin Service 统计方法 (AC: #2, #3, #4)
  - [x] 2.1 实现 getStats 方法
  - [x] 2.2 实现总用户数统计
  - [x] 2.3 实现今日新增用户数
  - [x] 2.4 实现本月新增用户数
  - [x] 2.5 使用并行查询优化性能

- [x] 3. 实现 Admin Controller 统计路由 (AC: #1, #5)
  - [x] 3.1 创建 GET /api/v1/admin/stats 路由
  - [x] 3.2 应用 JwtAuthGuard 和 RolesGuard
  - [x] 3.3 应用 @Roles(Role.ADMIN) 装饰器
  - [x] 3.4 返回统一响应格式

- [x] 4. 前端统计仪表盘页面 (AC: #6, #7)
  - [x] 4.1 创建 stats-cards.tsx
  - [x] 4.2 创建 Dashboard.tsx
  - [x] 4.3 实现统计卡片布局
  - [x] 4.4 添加图标和样式

## Dev Notes

### Epic Context

**Epic 7 目标**: 管理员可以查看用户数据和系统统计信息

**本 Story 的重要性:**
为管理员提供用户增长趋势的视图。

### Technical Requirements

**API 端点规范:**

```
GET /api/v1/admin/stats

Response 200:
{
  "statusCode": 200,
  "message": "success",
  "data": {
    "totalUsers": 42,
    "newUsersToday": 3,
    "newUsersThisMonth": 18
  }
}

Response 403 (非管理员):
{
  "statusCode": 403,
  "message": "需要管理员权限",
  "error": "Forbidden"
}
```

**Prisma 聚合查询模式:**

```typescript
async getStats(): Promise<SystemStatsDto> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalUsers, newUsersToday, newUsersThisMonth] = await Promise.all([
    this.prisma.user.count(),
    this.prisma.user.count({
      where: { createdAt: { gte: todayStart } },
    }),
    this.prisma.user.count({
      where: { createdAt: { gte: monthStart } },
    }),
  ]);

  return {
    totalUsers,
    newUsersToday,
    newUsersThisMonth,
  };
}
```

**DTO 定义:**

```typescript
export class SystemStatsDto {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
}
```

### Architecture Compliance

**路由配置:**

```
/api/v1/admin           # 管理员路由
  GET    /users        # 用户列表 (Story 7.2) ✅
  GET    /stats        # 统计信息 (Story 7.3) 🔄
```

**认证链:**

```
Request → JwtAuthGuard → RolesGuard → Controller
           (验证token)  (验证角色)
```

### File Structure Requirements

**修改文件:**

```
apps/api/src/modules/admin/
├── admin.controller.ts                # 修改 - 添加 getStats 路由
├── admin.service.ts                   # 修改 - 添加 getStats 方法
└── dto/
    └── stats-response.dto.ts          # 新建 - 统计响应 DTO
```

**前端文件:**

```
apps/web/src/
├── components/
│   └── admin/
│       └── stats-cards.tsx            # 新建 - 统计卡片组件
├── pages/
│   └── admin/
│       └── Dashboard.tsx              # 新建 - 管理仪表盘页面
└── hooks/
    └── useAdminStats.ts               # 新建 - 统计数据 React Query hook
```

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **顺序执行查询** - ✅ 使用 Promise.all 并行执行
2. **时区问题** - ✅ 使用服务器本地时间

**✅ 正确做法:**

1. 并行执行独立查询
2. 注意时区处理

### Testing Requirements

**验证清单:**

1. **单元测试**
   - [ ] AdminService.getStats 正确计算所有指标

2. **集成测试**
   - [ ] 管理员用户可以获取统计数据 (200)
   - [ ] 普通用户访问返回 403
   - [ ] 未认证用户访问返回 401

## Dev Agent Record

### Completion Notes List

**完成日期:** 2025-01-16

**实现摘要:**
1. ✅ 后端 stats-response.dto.ts
2. ✅ 后端 admin.service.getStats()
3. ✅ 后端 admin.controller.getStats()
4. ✅ 共享类型 packages/shared/src/types/admin.types.ts
5. ✅ 前端 adminApi.getStats()
6. ✅ 前端 useAdminStats hook
7. ✅ 前端 StatsCards 组件
8. ✅ 前端 Dashboard 页面

### File List

### New Files
- `apps/api/src/modules/admin/dto/stats-response.dto.ts`
- `packages/shared/src/types/admin.types.ts`
- `apps/web/src/components/admin/stats-cards.tsx`
- `apps/web/src/pages/admin/Dashboard.tsx`
- `apps/web/src/hooks/useAdminStats.ts`

### Modified Files
- `apps/api/src/modules/admin/admin.controller.ts`
- `apps/api/src/modules/admin/admin.service.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/App.tsx`
- `packages/shared/src/types/index.ts`
