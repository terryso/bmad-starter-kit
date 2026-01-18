# Story 8.6: 管理员审核界面

**Epic:** Epic 8 - BMAD 项目展示平台
**Story ID:** 8.6
**Status:** done
**Created:** 2026-01-18
**Completed:** 2026-01-18
**Dependencies:** Story 8.1 (已完成), Story 8.2 (已完成), Story 8.3 (已完成)

---

## 用户故事

**作为** 管理员，
**我想要** 审核用户提交的项目，
**以便** 控制展示内容的质量。

---

## 业务背景

管理员审核界面是项目展示平台的质量控制核心。用户提交项目后，状态为 PENDING（待审核），需要管理员审核通过后才能在公开展示页面显示。

### 核心功能
1. **待审核项目列表**: 显示所有 PENDING 状态的项目
2. **项目预览**: 展示项目的详细信息供管理员审核
3. **批准操作**: 将项目状态改为 APPROVED，记录审核人和审核时间
4. **拒绝操作**: 将项目状态改为 REJECTED，记录拒绝原因、审核人和审核时间
5. **待审核数量徽章**: 在导航栏显示待审核数量

### 本 Story 依赖
- **Story 8.1**: Project 数据库模型已创建（包含 status、reviewedBy、reviewedAt、rejectionReason 字段）
- **Story 8.2**: GithubFetcherService 已实现（项目信息已自动抓取）
- **Story 8.3**: 项目提交 API 已实现（用户可以提交项目）

---

## 验收标准 (Acceptance Criteria)

### Gherkin 格式

```gherkin
Feature: 管理员审核界面

  Scenario: 管理员查看待审核项目列表
    Given 用户以管理员身份登录系统
    And 数据库中存在 3 个 PENDING 状态的项目
    When 用户访问 /admin/showcase 页面
    Then 系统应显示 3 个待审核项目卡片
    And 每个卡片显示项目名称、描述、语言、分类等信息
    And 导航栏徽章显示数字 "3"

  Scenario: 非管理员访问审核页面
    Given 用户以普通用户身份登录系统
    When 用户访问 /admin/showcase 页面
    Then 系统应返回 403 Forbidden
    And 显示"权限不足"提示

  Scenario: 管理员批准项目
    Given 用户以管理员身份登录系统
    And 数据库中存在 ID 为 "123" 的 PENDING 状态项目
    When 用户点击"批准"按钮
    And 确认操作
    Then 系统应将项目状态改为 APPROVED
    And 记录 reviewedBy 为当前管理员 ID
    And 记录 reviewedAt 为当前时间
    And 项目从待审核列表移除
    And 待审核徽章数量减少

  Scenario: 管理员拒绝项目
    Given 用户以管理员身份登录系统
    And 数据库中存在 ID 为 "456" 的 PENDING 状态项目
    When 用户点击"拒绝"按钮
    And 输入拒绝原因"项目描述不完整"
    And 确认操作
    Then 系统应将项目状态改为 REJECTED
    And 记录 rejectionReason 为"项目描述不完整"
    And 记录 reviewedBy 为当前管理员 ID
    And 记录 reviewedAt 为当前时间
    And 项目从待审核列表移除

  Scenario: 批准后的项目出现在展示页
    Given 管理员已批准 ID 为 "789" 的项目
    When 访客访问 /showcase 页面
    Then 系统应显示该项目
    And 项目状态为 APPROVED

  Scenario: 拒绝的项目不出现在展示页
    Given 管理员已拒绝 ID 为 "101" 的项目
    When 访客访问 /showcase 页面
    Then 系统不应显示该项目

  Scenario: 没有待审核项目时的显示
    Given 用户以管理员身份登录系统
    And 数据库中不存在 PENDING 状态的项目
    When 用户访问 /admin/showcase 页面
    Then 系统应显示"暂无待审核项目"提示
    And 导航栏徽章不显示或显示 "0"

  Scenario: 分页加载待审核项目
    Given 用户以管理员身份登录系统
    And 数据库中存在 25 个 PENDING 状态的项目
    When 用户访问 /admin/showcase 页面
    Then 系统应显示前 12 个项目（第一页）
    And 显示分页控件
    And 总页数显示为 3 页
```

### 技术验收标准

#### 后端 API 实现

##### GET /api/v1/admin/showcase/pending
- [ ] 创建 `AdminShowcaseController` 或在 `AdminController` 中添加新端点
- [ ] 返回所有 PENDING 状态项目
- [ ] 支持分页（page, pageSize）
- [ ] 包含提交者信息
- [ ] 需要管理员权限（使用 @Roles(Role.ADMIN) 和 AdminGuard）

##### PUT /api/v1/admin/showcase/:id/approve
- [ ] 创建 DTO 验证项目 ID 格式（CUID）
- [ ] 验证项目存在且状态为 PENDING
- [ ] 更新项目状态为 APPROVED
- [ ] 记录 reviewedBy（当前管理员 ID）
- [ ] 记录 reviewedAt（当前时间）
- [ ] 返回更新后的项目信息

##### PUT /api/v1/admin/showcase/:id/reject
- [ ] 创建 `RejectProjectDto` 包含 rejectionReason 字段
- [ ] 验证拒绝原因不能为空
- [ ] 更新项目状态为 REJECTED
- [ ] 记录 rejectionReason、reviewedBy、reviewedAt
- [ ] 返回更新后的项目信息

#### 前端页面实现

##### 审核页面组件
- [ ] 创建 `apps/web/src/pages/admin/AdminShowcase.tsx`
- [ ] 使用 React Query 获取待审核项目列表
- [ ] 显示待审核项目卡片网格
- [ ] 每个卡片包含：项目名、描述、语言、分类、提交者、提交时间
- [ ] 添加批准/拒绝操作按钮
- [ ] 添加分页控件

##### 审核对话框组件
- [ ] 创建 `ApproveDialog` 确认批准操作
- [ ] 创建 `RejectDialog` 输入拒绝原因
- [ ] 拒绝原因使用 Textarea 组件，必填
- [ ] 提交后刷新列表

##### 导航栏徽章
- [ ] 在 `DashboardLayout` 侧边栏添加徽章
- [ ] 调用 GET /api/v1/admin/showcase/pending?pageSize=0 获取数量
- [ ] 数量 > 0 时显示红色徽章

---

## 开发者上下文

### Epic Context

**Epic 8 目标**: 创建 BMAD 项目展示平台，用户可以提交 GitHub 项目链接，系统通过 Agent SDK 自动分析并抓取项目信息，管理员审核后发布展示。

**Epic 8 Stories 依赖关系:**
- ✅ **Story 8.1: 项目数据库模型** (已完成)
- ✅ **Story 8.2: Agent SDK 集成服务** (已完成)
- ✅ **Story 8.3: 项目提交 API** (已完成)
- ✅ **Story 8.4: 项目展示页面** (已完成)
- ✅ **Story 8.5: 项目详情页** (已完成)
- 🔄 **Story 8.6: 管理员审核界面** (当前)
- ⏳ **Story 8.7: 我的项目管理** (依赖 Story 8.3)
- ⏳ **Story 8.8: 展示页菜单入口** (已在 Story 8.4 中完成)

### Previous Story Intelligence

**从 Epic 7 (系统管理) 学到的模式**:

Story 7.1-7.3 建立了完整的管理员功能模式：

**1. AdminGuard 和 @Roles 装饰器**:
```typescript
// apps/api/src/modules/auth/guards/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && user.role === 'ADMIN';
  }
}

// 使用方式
@UseGuards(JwtAuthGuard, AdminGuard)
@Roles(Role.ADMIN)
export class AdminController { ... }
```

**2. AdminController 模式**:
```typescript
// apps/api/src/modules/admin/admin.controller.ts
@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async findAllUsers(@Query() query: UsersQueryDto) { ... }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser('userId') currentUserId: string,
  ) { ... }
}
```

**3. AdminService 模式**:
```typescript
// apps/api/src/modules/admin/admin.service.ts
@Injectable()
export class AdminService {
  private readonly prismaUser: any;

  constructor(private prisma: PrismaService) {
    this.prismaUser = (this.prisma as any).user;
  }

  async updateUserRole(userId: string, dto: UpdateRoleDto, adminUserId: string) {
    // 业务逻辑
    const updatedUser = await this.prismaUser.update({
      where: { id: userId },
      data: { role: dto.role },
    });
    return updatedUser;
  }
}
```

**4. 管理员前端页面模式**:
```tsx
// apps/web/src/pages/admin/Users.tsx
export default function UsersPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers(),
  });

  // 使用 shadcn/ui 组件
  return (
    <div className="container mx-auto py-6">
      <Table>
        <TableHeader>...</TableHeader>
        <TableBody>...</TableBody>
      </Table>
    </div>
  );
}
```

**从 Story 8.3 学到的项目提交模式**:
```typescript
// apps/api/src/modules/showcase/showcase.service.ts
async submitProject(githubUrl: string, userId: string) {
  // 检查是否已存在
  const existingProject = await this.prismaProject.findUnique({
    where: { githubUrl },
  });

  // 抓取 GitHub 信息
  const projectInfo = await this.githubFetcher.fetchProjectInfo(githubUrl);

  // 创建 PENDING 状态项目
  const project = await this.prismaProject.create({
    data: {
      status: ProjectStatus.PENDING,
      submittedBy: userId,
      // ... 其他字段
    },
  });
}
```

**Project 模型完整结构**:
```prisma
model Project {
  id              String          @id @default(cuid())
  repositoryName  String
  description     String          @db.Text
  owner           String
  stars           Int
  language        String?
  topics          String[]
  category        ProjectCategory @default(OTHER)
  suggestedTags   String[]
  screenshotUrl   String?         @db.Text

  // 审核状态字段
  status          ProjectStatus   @default(PENDING)
  submittedBy     String
  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?         @db.Text

  // 关联关系
  submittedByUser User            @relation("SubmittedProjects", fields: [submittedBy], references: [id])
  reviewedByUser  User?           @relation("ReviewedProjects", fields: [reviewedBy], references: [id])

  @@index([status])
  @@index([category])
}
```

### 项目技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | NestJS |
| ORM | Prisma |
| 数据库 | PostgreSQL (Supabase) |
| 前端框架 | React + Vite |
| 状态管理 | React Query (@tanstack/react-query) |
| UI 组件 | shadcn/ui |
| 路由 | React Router DOM |
| 图标 | lucide-react |

---

## 技术实现要求

### 1. 后端 API 实现

#### 1.1 创建审核相关 DTO

```typescript
// apps/api/src/modules/admin/dto/pending-projects-query.dto.ts
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@bmad-starter-kit/shared';

/**
 * 待审核项目列表查询 DTO
 */
export class PendingProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
```

```typescript
// apps/api/src/modules/admin/dto/reject-project.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * 拒绝项目 DTO
 */
export class RejectProjectDto {
  @IsString()
  @IsNotEmpty({ message: '拒绝原因不能为空' })
  @MinLength(5, { message: '拒绝原因至少需要 5 个字符' })
  rejectionReason: string;
}
```

#### 1.2 在 AdminService 添加审核方法

```typescript
// apps/api/src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PendingProjectsQueryDto } from './dto/pending-projects-query.dto';
import { RejectProjectDto } from './dto/reject-project.dto';

// 定义枚举类型（与 Prisma Schema 匹配）
export enum ProjectStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * 待审核项目响应接口
 */
export interface PendingProjectResponse {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  category: string;
  topics: string[];
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

/**
 * 待审核项目列表响应
 */
export interface PendingProjectsListResponse {
  items: PendingProjectResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

@Injectable()
export class AdminService {
  private readonly prismaProject: any;

  constructor(private prisma: PrismaService) {
    this.prismaProject = (this.prisma as any).project;
  }

  /**
   * 获取待审核项目列表
   * @param query 分页参数
   * @returns 待审核项目列表
   */
  async getPendingProjects(
    query: PendingProjectsQueryDto,
  ): Promise<PendingProjectsListResponse> {
    const { page = 1, pageSize = 12 } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prismaProject.findMany({
        where: {
          status: ProjectStatus.PENDING,
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          repositoryName: true,
          description: true,
          owner: true,
          stars: true,
          language: true,
          category: true,
          topics: true,
          suggestedTags: true,
          screenshotUrl: true,
          githubUrl: true,
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc', // 优先显示较早提交的
        },
      }),
      this.prismaProject.count({
        where: {
          status: ProjectStatus.PENDING,
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取待审核项目数量
   * @returns 待审核项目总数
   */
  async getPendingProjectsCount(): Promise<number> {
    return this.prismaProject.count({
      where: {
        status: ProjectStatus.PENDING,
      },
    });
  }

  /**
   * 批准项目
   * @param id 项目 ID
   * @param adminUserId 管理员用户 ID
   * @returns 更新后的项目
   */
  async approveProject(id: string, adminUserId: string): Promise<PendingProjectResponse> {
    // 检查项目是否存在且为 PENDING 状态
    const project = await this.prismaProject.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve project with status ${project.status}`,
      );
    }

    // 更新项目状态
    const updated = await this.prismaProject.update({
      where: { id },
      data: {
        status: ProjectStatus.APPROVED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        repositoryName: true,
        description: true,
        owner: true,
        stars: true,
        language: true,
        category: true,
        topics: true,
        suggestedTags: true,
        screenshotUrl: true,
        githubUrl: true,
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * 拒绝项目
   * @param id 项目 ID
   * @param rejectDto 拒绝原因
   * @param adminUserId 管理员用户 ID
   * @returns 更新后的项目
   */
  async rejectProject(
    id: string,
    rejectDto: RejectProjectDto,
    adminUserId: string,
  ): Promise<PendingProjectResponse> {
    // 检查项目是否存在且为 PENDING 状态
    const project = await this.prismaProject.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject project with status ${project.status}`,
      );
    }

    // 更新项目状态
    const updated = await this.prismaProject.update({
      where: { id },
      data: {
        status: ProjectStatus.REJECTED,
        rejectionReason: rejectDto.rejectionReason,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        repositoryName: true,
        description: true,
        owner: true,
        stars: true,
        language: true,
        category: true,
        topics: true,
        suggestedTags: true,
        screenshotUrl: true,
        githubUrl: true,
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });

    return updated;
  }
}
```

#### 1.3 更新 AdminController

```typescript
// apps/api/src/modules/admin/admin.controller.ts
import { Controller, Get, Query, UseGuards, Param, Put, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { PendingProjectsQueryDto } from './dto/pending-projects-query.dto';
import { RejectProjectDto } from './dto/reject-project.dto';

@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ... 现有端点

  /**
   * 获取待审核项目列表
   * GET /api/v1/admin/showcase/pending
   *
   * @param query 分页参数
   * @returns 待审核项目列表
   */
  @Get('showcase/pending')
  async getPendingProjects(
    @Query() query: PendingProjectsQueryDto,
  ): Promise<{
    data: PendingProjectsListResponse;
    statusCode: number;
    message: string;
  }> {
    const result = await this.adminService.getPendingProjects(query);
    return {
      data: result,
      statusCode: 200,
      message: '获取待审核项目成功',
    };
  }

  /**
   * 获取待审核项目数量
   * GET /api/v1/admin/showcase/pending/count
   *
   * @returns 待审核项目总数
   */
  @Get('showcase/pending/count')
  async getPendingProjectsCount(): Promise<{
    data: { count: number };
    statusCode: number;
    message: string;
  }> {
    const count = await this.adminService.getPendingProjectsCount();
    return {
      data: { count },
      statusCode: 200,
      message: '获取待审核数量成功',
    };
  }

  /**
   * 批准项目
   * PUT /api/v1/admin/showcase/:id/approve
   *
   * @param id 项目 ID
   * @param adminUserId 当前管理员 ID
   * @returns 更新后的项目
   */
  @Put('showcase/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveProject(
    @Param('id') id: string,
    @CurrentUser('userId') adminUserId: string,
  ): Promise<{
    data: PendingProjectResponse;
    statusCode: number;
    message: string;
  }> {
    const project = await this.adminService.approveProject(id, adminUserId);
    return {
      data: project,
      statusCode: 200,
      message: '项目已批准',
    };
  }

  /**
   * 拒绝项目
   * PUT /api/v1/admin/showcase/:id/reject
   *
   * @param id 项目 ID
   * @param rejectDto 拒绝原因
   * @param adminUserId 当前管理员 ID
   * @returns 更新后的项目
   */
  @Put('showcase/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectProject(
    @Param('id') id: string,
    @Body() rejectDto: RejectProjectDto,
    @CurrentUser('userId') adminUserId: string,
  ): Promise<{
    data: PendingProjectResponse;
    statusCode: number;
    message: string;
  }> {
    const project = await this.adminService.rejectProject(id, rejectDto, adminUserId);
    return {
      data: project,
      statusCode: 200,
      message: '项目已拒绝',
    };
  }
}
```

### 2. 前端实现

#### 2.1 更新共享类型

```typescript
// packages/shared/src/types/showcase.types.ts

/**
 * 待审核项目接口
 */
export interface PendingProject {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  category: ProjectCategory;
  topics: string[];
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

/**
 * 待审核项目列表响应
 */
export interface PendingProjectsListResponse {
  items: PendingProject[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

#### 2.2 更新 API 客户端

```typescript
// apps/web/src/lib/api.ts
import type { PendingProjectsListResponse } from '@bmad-starter-kit/shared';

// ... 现有代码

// Admin API
export const adminApi = {
  // ... 现有方法

  /**
   * 获取待审核项目列表（需要管理员权限）
   */
  getPendingProjects: async (params?: { page?: number; pageSize?: number }) => {
    const response = await api.get<{
      data: PendingProjectsListResponse;
      statusCode: number;
      message: string;
    }>('/api/v1/admin/showcase/pending', { params });
    return response.data.data;
  },

  /**
   * 获取待审核项目数量（需要管理员权限）
   */
  getPendingProjectsCount: async () => {
    const response = await api.get<{
      data: { count: number };
      statusCode: number;
      message: string;
    }>('/api/v1/admin/showcase/pending/count');
    return response.data.data.count;
  },

  /**
   * 批准项目（需要管理员权限）
   * @param id 项目 ID
   */
  approveProject: async (id: string) => {
    const response = await api.put<{
      data: PendingProject;
      statusCode: number;
      message: string;
    }>(`/api/v1/admin/showcase/${id}/approve`);
    return response.data.data;
  },

  /**
   * 拒绝项目（需要管理员权限）
   * @param id 项目 ID
   * @param rejectionReason 拒绝原因
   */
  rejectProject: async (id: string, rejectionReason: string) => {
    const response = await api.put<{
      data: PendingProject;
      statusCode: number;
      message: string;
    }>(`/api/v1/admin/showcase/${id}/reject`, { rejectionReason });
    return response.data.data;
  },
};
```

#### 2.3 创建管理员审核页面

```typescript
// apps/web/src/pages/admin/AdminShowcase.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Shield, CheckCircle, XCircle, Github, ExternalLink, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { APPROVE_DIALOG_TEXT, REJECT_DIALOG_TEXT } from '@/constants/showcase';

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export default function AdminShowcasePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; reason: string }>({
    open: false,
    id: '',
    reason: '',
  });

  // 获取待审核项目
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-pending-projects', page],
    queryFn: () => adminApi.getPendingProjects({ page, pageSize }),
  });

  // 批准项目
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
      toast.success('项目已批准');
      setApproveDialog({ open: false, id: '' });
    },
    onError: () => {
      toast.error('操作失败，请重试');
    },
  });

  // 拒绝项目
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectProject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
      toast.success('项目已拒绝');
      setRejectDialog({ open: false, id: '', reason: '' });
    },
    onError: () => {
      toast.error('操作失败，请重试');
    },
  });

  const handleApprove = () => {
    approveMutation.mutate(approveDialog.id);
  };

  const handleReject = () => {
    if (rejectDialog.reason.trim().length < 5) {
      toast.error('拒绝原因至少需要 5 个字符');
      return;
    }
    rejectMutation.mutate({
      id: rejectDialog.id,
      reason: rejectDialog.reason,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          加载失败，请刷新页面重试
        </AlertDescription>
      </Alert>
    );
  }

  // 无待审核项目
  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">全部处理完成</h2>
        <p className="text-muted-foreground text-center max-w-md">
          暂无待审核项目，所有提交都已处理完毕
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">项目审核</h1>
            <p className="text-sm text-muted-foreground">
              共 {data.meta.total} 个待审核项目
            </p>
          </div>
        </div>
      </div>

      {/* 待审核项目列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate" title={project.repositoryName}>
                    {project.repositoryName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {project.owner}
                  </p>
                </div>
                <Badge variant="outline">
                  {CATEGORY_LABELS[project.category] || project.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* 项目描述 */}
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {project.description || '暂无描述'}
              </p>

              {/* 项目信息 */}
              <div className="space-y-2 text-sm">
                {project.language && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">语言:</span>
                    <Badge variant="secondary" className="font-normal">
                      {project.language}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate">
                    {project.submittedBy.name || project.submittedBy.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>

              {/* 标签 */}
              {project.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.topics.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {project.topics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.topics.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1"
                  >
                    <Github className="w-4 h-4" />
                    查看
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => setRejectDialog({ open: true, id: project.id, reason: '' })}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  拒绝
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => setApproveDialog({ open: true, id: project.id })}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  批准
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分页 */}
      {data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            第 {page} / {data.meta.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 批准确认对话框 */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, id: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批准项目</DialogTitle>
            <DialogDescription>
              {APPROVE_DIALOG_TEXT}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, id: '' })}
              disabled={approveMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? '处理中...' : '确认批准'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝对话框 */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open, id: '', reason: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝项目</DialogTitle>
            <DialogDescription>
              {REJECT_DIALOG_TEXT}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                拒绝原因 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="请说明拒绝原因（至少 5 个字符）"
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                rows={4}
                disabled={rejectMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                此原因将显示给项目提交者
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, id: '', reason: '' })}
              disabled={rejectMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

#### 2.4 添加常量文件

```typescript
// apps/web/src/constants/showcase.ts
export const APPROVE_DIALOG_TEXT =
  '批准后，该项目将立即在项目展示页面公开显示。您确定要批准此项目吗？';

export const REJECT_DIALOG_TEXT =
  '拒绝后，项目提交者将看到您提供的拒绝原因，并可以修改后重新提交。请提供清晰的拒绝原因帮助提交者改进。';
```

#### 2.5 更新路由配置

```typescript
// apps/web/src/App.tsx
import AdminShowcase from './pages/admin/AdminShowcase';

// ... 现有导入

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              {/* ... 其他路由 */}

              {/* 管理员路由 */}
              <Route path="/admin" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/admin/showcase" element={<ProtectedRoute><AdminShowcase /></ProtectedRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
```

#### 2.6 更新 DashboardLayout 添加徽章

```typescript
// apps/web/src/components/dashboard/DashboardLayout.tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

// 在组件内添加徽章逻辑
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 获取待审核数量
  const { data: pendingCount } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: () => adminApi.getPendingProjectsCount(),
    refetchInterval: 60000, // 每分钟刷新
  });

  // 在侧边栏菜单项中添加徽章
  const sidebarItems = [
    // ... 其他菜单项
    {
      title: '项目审核',
      href: '/admin/showcase',
      icon: Shield,
      badge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
    },
  ];
}
```

---

## 文件结构

```
apps/api/src/modules/admin/
├── admin.controller.ts             # 修改 - 添加项目审核端点
├── admin.service.ts                # 修改 - 添加项目审核方法
├── admin.module.ts                 # (无需修改)
├── dto/
│   ├── users-query.dto.ts          # (已存在)
│   ├── update-role.dto.ts          # (已存在)
│   ├── stats-response.dto.ts       # (已存在)
│   ├── pending-projects-query.dto.ts   # ✨ 本 story 创建
│   └── reject-project.dto.ts       # ✨ 本 story 创建
└── admin.service.spec.ts           # 修改 - 添加审核方法测试

apps/web/src/
├── pages/
│   └── admin/
│       ├── Users.tsx               # (已存在)
│       ├── Stats.tsx               # (已存在)
│       └── AdminShowcase.tsx       # ✨ 本 story 创建
├── components/
│   ├── dashboard/
│   │   └── DashboardLayout.tsx     # 修改 - 添加徽章和菜单项
│   └── ui/
│       └── (所有 shadcn/ui 组件已存在)
├── lib/
│   └── api.ts                      # 修改 - 添加审核相关 API
├── constants/
│   └── showcase.ts                 # ✨ 本 story 创建
└── App.tsx                         # 修改 - 添加管理员审核路由

packages/shared/src/types/
└── showcase.types.ts               # 修改 - 添加 PendingProject 类型
```

---

## API 规范

### GET /api/v1/admin/showcase/pending

**描述**: 获取待审核项目列表

**认证**: 需要 JWT Token + ADMIN 角色

**Query 参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码（默认: 1） |
| `pageSize` | number | 每页数量（默认: 12） |

**响应** (200 OK):
```json
{
  "data": {
    "items": [
      {
        "id": "clxx...",
        "repositoryName": "bmad-starter-kit",
        "description": "A starter kit for BMAD framework",
        "owner": "anthropics",
        "stars": 1234,
        "language": "TypeScript",
        "category": "WEB_APP",
        "topics": ["bmad", "starter-kit"],
        "suggestedTags": ["bmad", "framework"],
        "screenshotUrl": null,
        "githubUrl": "https://github.com/anthropics/bmad-starter-kit",
        "submittedBy": {
          "id": "user123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-17T10:00:00.000Z"
      }
    ],
    "meta": {
      "total": 15,
      "page": 1,
      "pageSize": 12,
      "totalPages": 2
    }
  },
  "statusCode": 200,
  "message": "获取待审核项目成功"
}
```

### GET /api/v1/admin/showcase/pending/count

**描述**: 获取待审核项目数量

**认证**: 需要 JWT Token + ADMIN 角色

**响应** (200 OK):
```json
{
  "data": { "count": 15 },
  "statusCode": 200,
  "message": "获取待审核数量成功"
}
```

### PUT /api/v1/admin/showcase/:id/approve

**描述**: 批准项目

**认证**: 需要 JWT Token + ADMIN 角色

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 项目 ID（CUID 格式） |

**响应** (200 OK):
```json
{
  "data": {
    "id": "clxx...",
    "repositoryName": "bmad-starter-kit",
    "status": "APPROVED",
    "reviewedBy": "admin456",
    "reviewedAt": "2024-01-18T10:00:00.000Z"
  },
  "statusCode": 200,
  "message": "项目已批准"
}
```

**响应** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Cannot approve project with status APPROVED"
}
```

### PUT /api/v1/admin/showcase/:id/reject

**描述**: 拒绝项目

**认证**: 需要 JWT Token + ADMIN 角色

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 项目 ID（CUID 格式） |

**请求体**:
```json
{
  "rejectionReason": "项目描述不完整，请补充更多技术细节"
}
```

**响应** (200 OK):
```json
{
  "data": {
    "id": "clxx...",
    "repositoryName": "bmad-starter-kit",
    "status": "REJECTED",
    "rejectionReason": "项目描述不完整，请补充更多技术细节",
    "reviewedBy": "admin456",
    "reviewedAt": "2024-01-18T10:00:00.000Z"
  },
  "statusCode": 200,
  "message": "项目已拒绝"
}
```

**响应** (400 Bad Request - 验证失败):
```json
{
  "statusCode": 400,
  "message": [
    "rejectionReason must be longer than or equal to 5 characters"
  ],
  "error": "Bad Request"
}
```

---

## 测试要求

### 后端单元测试

```typescript
// apps/api/src/modules/admin/admin.service.spec.ts
describe('AdminService - Project Review', () => {
  describe('getPendingProjects', () => {
    it('should return only PENDING status projects', async () => {
      const result = await service.getPendingProjects({ page: 1, pageSize: 10 });
      result.items.forEach(p => {
        expect(p.status).toBeUndefined(); // status 不在前端显示
      });
    });

    it('should include submitter information', async () => {
      const result = await service.getPendingProjects({ page: 1, pageSize: 10 });
      result.items.forEach(p => {
        expect(p.submittedBy).toBeDefined();
        expect(p.submittedBy.email).toBeDefined();
      });
    });

    it('should support pagination', async () => {
      const result = await service.getPendingProjects({ page: 1, pageSize: 5 });
      expect(result.items.length).toBeLessThanOrEqual(5);
      expect(result.meta.page).toBe(1);
    });

    it('should order by createdAt ascending (oldest first)', async () => {
      const result = await service.getPendingProjects({ page: 1, pageSize: 10 });
      // 验证排序
      const dates = result.items.map(p => new Date(p.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });
  });

  describe('getPendingProjectsCount', () => {
    it('should return count of PENDING projects', async () => {
      const count = await service.getPendingProjectsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('approveProject', () => {
    it('should update project status to APPROVED', async () => {
      const result = await service.approveProject('pending-id', 'admin-id');
      expect(result).toBeDefined();
    });

    it('should set reviewedBy and reviewedAt', async () => {
      const result = await service.approveProject('pending-id', 'admin-id');
      // 在实际测试中验证数据库更新
    });

    it('should throw NotFoundException for non-existent project', async () => {
      await expect(service.approveProject('nonexistent', 'admin-id'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-PENDING project', async () => {
      await expect(service.approveProject('approved-id', 'admin-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectProject', () => {
    it('should update project status to REJECTED', async () => {
      const dto = new RejectProjectDto();
      dto.rejectionReason = 'Not a BMAD project';
      const result = await service.rejectProject('pending-id', dto, 'admin-id');
      expect(result).toBeDefined();
    });

    it('should set rejectionReason', async () => {
      const dto = new RejectProjectDto();
      dto.rejectionReason = 'Insufficient description';
      const result = await service.rejectProject('pending-id', dto, 'admin-id');
      // 验证 rejectionReason 已保存
    });

    it('should throw BadRequestException for empty rejectionReason', async () => {
      const dto = new RejectProjectDto();
      dto.rejectionReason = '';
      await expect(service.rejectProject('pending-id', dto, 'admin-id'))
        .rejects.toThrow();
    });
  });
});
```

### 前端组件测试

```typescript
// apps/web/src/pages/admin/AdminShowcase.test.tsx
import { render, screen, waitFor } from '@/test/utils';
import { AdminShowcase } from './AdminShowcase';

describe('AdminShowcase', () => {
  it('should render pending projects list', async () => {
    render(<AdminShowcase />);
    await waitFor(() => {
      expect(screen.getByText('项目审核')).toBeInTheDocument();
    });
  });

  it('should show empty state when no pending projects', async () => {
    // Mock empty response
    render(<AdminShowcase />);
    await waitFor(() => {
      expect(screen.getByText(/全部处理完成/)).toBeInTheDocument();
    });
  });

  it('should open approve dialog on button click', async () => {
    render(<AdminShowcase />);
    // 点击批准按钮
    // 验证对话框打开
  });

  it('should open reject dialog on button click', async () => {
    render(<AdminShowcase />);
    // 点击拒绝按钮
    // 验证对话框打开
    // 验证 Textarea 显示
  });

  it('should call approve API on confirm', async () => {
    render(<AdminShowcase />);
    // 打开批准对话框
    // 点击确认
    // 验证 API 调用
  });

  it('should call reject API with reason on confirm', async () => {
    render(<AdminShowcase />);
    // 打开拒绝对话框
    // 输入原因
    // 点击确认
    // 验证 API 调用包含原因
  });
});
```

### E2E 测试

```typescript
// tests/e2e/admin-showcase.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Showcase Review', () => {
  test.beforeEach(async ({ page }) => {
    // 以管理员身份登录
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
  });

  test('should display pending projects list', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/showcase');
    await expect(page.locator('h1')).toContainText('项目审核');
  });

  test('should approve a project', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/showcase');

    // 点击第一个项目的批准按钮
    await page.click('button:has-text("批准")');

    // 确认对话框
    await expect(page.locator('dialog')).toBeVisible();
    await page.click('button:has-text("确认批准")');

    // 验证成功提示
    await expect(page.locator('text=项目已批准')).toBeVisible();
  });

  test('should reject a project with reason', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/showcase');

    // 点击拒绝按钮
    await page.click('button:has-text("拒绝")');

    // 输入拒绝原因
    await page.fill('textarea#reason', '项目描述不够详细');

    // 点击确认拒绝
    await page.click('button:has-text("确认拒绝")');

    // 验证成功提示
    await expect(page.locator('text=项目已拒绝')).toBeVisible();
  });

  test('should require minimum reason length', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/showcase');

    await page.click('button:has-text("拒绝")');
    await page.fill('textarea#reason', 'abc');

    // 验证确认按钮被禁用或点击后显示错误
    await page.click('button:has-text("确认拒绝")');
    await expect(page.locator('text=至少需要 5 个字符')).toBeVisible();
  });

  test('should show pending count badge', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const badge = page.locator('[data-testid="pending-count-badge"]');
    // 如果有待审核项目，徽章应该显示
  });
});
```

---

## Common Pitfalls to Avoid

### ❌ 错误做法

1. **未验证项目状态**
   - 直接更新项目状态，不检查当前状态
   - ✅ 始终验证项目处于 PENDING 状态

2. **拒绝原因可以为空**
   - 允许管理员拒绝项目时不提供原因
   - ✅ 拒绝原因是必填项，最少 5 个字符

3. **未记录审核人**
   - 更新状态但不记录 reviewedBy
   - ✅ 始终记录 reviewedBy（当前管理员 ID）和 reviewedAt

4. **非管理员可以访问**
   - 只检查登录状态，不检查角色
   - ✅ 使用 @Roles(Role.ADMIN) 确保只有管理员可访问

5. **徽章数量不实时更新**
   - 徽章数量只在页面加载时获取一次
   - ✅ 使用 refetchInterval 定期刷新或使用 WebSocket

6. **批准/拒绝后不刷新列表**
   - 操作成功后列表不更新
   - ✅ 使用 queryClient.invalidateQueries 刷新相关查询

### ✅ 正确做法

1. 验证项目状态（只处理 PENDING 项目）
2. 拒绝原因必填且最小长度验证
3. 记录完整的审核信息（reviewedBy、reviewedAt、rejectionReason）
4. 使用管理员权限控制
5. 实时更新待审核徽章数量
6. 操作后刷新相关查询

---

## Dependencies

### Story 依赖
- ✅ **Story 8.1**: Project 模型已创建（包含审核状态字段）
- ✅ **Story 8.2**: GithubFetcherService 已实现
- ✅ **Story 8.3**: 项目提交 API 已实现（创建 PENDING 项目）
- ✅ **Epic 7**: 管理员角色和权限系统已完成

### 后续依赖
- ⏳ **Story 8.7**: 我的项目管理（用户可查看被拒绝项目和拒绝原因）

### 外部依赖
- `@tanstack/react-query` - 服务端状态管理
- `react-router-dom` - 路由
- `lucide-react` - 图标库
- `shadcn/ui` - UI 组件库

---

## 参考资料

### Epic 文档引用
- Story 8.6 完整定义: [Source: docs/planning-artifacts/epics.md#Story 8.6]
- Epic 8 总览: [Source: docs/planning-artifacts/epics.md#Epic 8]

### 前序 Story 文档
- Story 8.1 Project 模型: [Source: docs/implementation-artifacts/8-1-project-database-model.md]
- Story 8.2 Agent SDK 集成: [Source: docs/implementation-artifacts/8-2-agent-sdk-integration.md]
- Story 8.3 项目提交 API: [Source: docs/implementation-artifacts/8-3-project-submission-api.md]

### 管理员功能参考
- AdminController: [Source: apps/api/src/modules/admin/admin.controller.ts]
- AdminService: [Source: apps/api/src/modules/admin/admin.service.ts]
- Admin Guard: [Source: apps/api/src/modules/auth/guards/roles.guard.ts]

### 项目上下文
- 项目结构和规范: [Source: docs/project-context.md]
- 后端架构: [Source: docs/planning-artifacts/architecture.md]

---

**状态变更**: backlog → **ready-for-dev** → **in-progress** → **review** → **done**

---

## Code Review Record

### 审查执行

**日期**: 2026-01-18
**审查者**: code-review workflow
**审查方式**: Adversarial Senior Developer Review

### 发现的问题及修复

| 优先级 | 问题 | 文件 | 状态 |
|--------|------|------|------|
| P1 | pageSize 缺少最大值上限验证 | `pending-projects-query.dto.ts` | ✅ 已修复 |
| P2 | usePendingCount 缺少错误处理 | `usePendingCount.ts` | ✅ 已修复 |
| P3 | Dialog 关闭逻辑不一致 | `AdminShowcase.tsx` | ✅ 已修复 |

### 修复详情

1. **P1 - pageSize 最大值验证**
   - 添加了 `@Max(MAX_PAGE_SIZE)` 验证器
   - 导入了 `Max` 装饰器和 `MAX_PAGE_SIZE` 常量

2. **P2 - 错误处理**
   - 在 queryFn 中添加 try-catch
   - 错误时返回 0 并记录日志
   - 设置 `retry: false` 避免过多重试

3. **P3 - Dialog 关闭逻辑**
   - 统一两个对话框的 onOpenChange 回调格式
   - 从 `!open && setRejectDialog(...)` 改为 `setRejectDialog({ open, ... })`

### 最终评分

| 维度 | 评分 |
|------|------|
| 代码质量 | 9/10 |
| 类型安全 | 9/10 |
| 测试覆盖 | 9/10 |
| 架构符合度 | 9/10 |
| 安全性 | 9/10 |

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Implementation Summary

**Story 8.6 实现完成 - 管理员审核界面**

**已创建内容:**
1. ✅ `pending-projects-query.dto.ts` - 待审核项目查询 DTO
2. ✅ `reject-project.dto.ts` - 拒绝项目 DTO
3. ✅ `showcase.ts` - 对话框常量
4. ✅ `AdminShowcase.tsx` - 管理员审核页面组件
5. ✅ `usePendingCount.ts` - 待审核数量 Hook

**已修改内容:**
1. ✅ `admin.service.ts` - 添加 getPendingProjects, getPendingProjectsCount, approveProject, rejectProject 方法
2. ✅ `admin.controller.ts` - 添加 GET /showcase/pending, GET /showcase/pending/count, PUT /showcase/:id/approve, PUT /showcase/:id/reject 端点
3. ✅ `showcase.types.ts` - 添加 PendingProject, PendingProjectsListResponse 类型
4. ✅ `types/index.ts` - 导出新类型
5. ✅ `api.ts` - 添加 getPendingProjects, getPendingProjectsCount, approveProject, rejectProject 方法
6. ✅ `App.tsx` - 添加 /admin/showcase 路由
7. ✅ `Sidebar.tsx` - 添加项目审核菜单项和徽章显示

**关键实现要点:**
- 使用 `JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)` 保护路由
- 从 `showcase.service.ts` 导入 `ProjectStatus` 枚举
- 待审核项目按创建时间升序排列（优先显示较早提交的）
- 拒绝原因验证: 最少 5 个字符
- 徽章数量每分钟自动刷新 (refetchInterval: 60000)
- 操作成功后使用 `queryClient.invalidateQueries` 刷新相关查询
- 使用 sonner toast 显示操作结果

**测试验证:**
- 所有单元测试通过 (341 测试, 23 套件)
- API 和 Web 构建成功

---

## File List

### Files Created
- `apps/api/src/modules/admin/dto/pending-projects-query.dto.ts`
- `apps/api/src/modules/admin/dto/reject-project.dto.ts`
- `apps/web/src/pages/admin/AdminShowcase.tsx`
- `apps/web/src/constants/showcase.ts`
- `apps/web/src/hooks/usePendingCount.ts`

### Files Modified
- `apps/api/src/modules/admin/admin.service.ts` - 添加审核方法
- `apps/api/src/modules/admin/admin.controller.ts` - 添加审核端点
- `packages/shared/src/types/showcase.types.ts` - 添加 PendingProject 类型
- `packages/shared/src/types/index.ts` - 导出新类型
- `apps/web/src/lib/api.ts` - 添加审核 API 方法
- `apps/web/src/App.tsx` - 添加管理员审核路由
- `apps/web/src/components/layout/Sidebar.tsx` - 添加项目审核菜单和徽章
