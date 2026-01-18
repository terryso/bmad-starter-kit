# Story 8.7: 我的项目管理

**Epic:** Epic 8 - BMAD 项目展示平台
**Story ID:** 8.7
**Status:** ready-for-dev
**Created:** 2026-01-18
**Dependencies:** Story 8.1 (已完成), Story 8.2 (已完成), Story 8.3 (已完成), Story 8.6 (已完成)

---

## 用户故事

**作为** 注册用户，
**我想要** 查看和管理我提交的项目，
**以便** 了解审核状态，并根据审核反馈进行修改。

---

## 业务背景

用户提交项目后，需要一个便捷的界面来查看自己提交的所有项目及其审核状态。"我的项目"功能提供：

1. **状态追踪**: 显示每个项目的当前状态（PENDING 待审核、APPROVED 已通过、REJECTED 已拒绝）
2. **拒绝原因展示**: 被拒绝的项目显示管理员提供的拒绝原因
3. **项目管理**: 允许删除待审核或已拒绝的项目
4. **重新提交**: 被拒绝的项目可以重新编辑后提交

### 本 Story 依赖
- **Story 8.1**: Project 数据库模型已创建（包含 status、rejectionReason、submittedBy 字段）
- **Story 8.3**: 项目提交 API 已实现（用户可以提交项目）
- **Story 8.6**: 管理员审核界面已实现（管理员可以批准/拒绝项目并记录原因）

---

## 验收标准 (Acceptance Criteria)

### Gherkin 格式

```gherkin
Feature: 我的项目管理

  Scenario: 查看我的项目列表
    Given 用户已登录系统
    And 用户提交了 3 个项目（1个已通过、1个待审核、1个已拒绝）
    When 用户访问 /showcase/my-projects 页面
    Then 系统应显示当前用户提交的所有 3 个项目
    And 每个项目显示其审核状态
    And 被拒绝的项目显示拒绝原因

  Scenario: 未登录用户访问
    Given 用户未登录系统
    When 用户访问 /showcase/my-projects 页面
    Then 系统应重定向到登录页
    And 显示需要登录的提示

  Scenario: 删除待审核项目
    Given 用户已登录系统
    And 用户有一个 PENDING 状态的项目
    When 用户点击该项目的"删除"按钮
    And 确认删除操作
    Then 系统应从数据库删除该项目
    And 项目从列表中移除

  Scenario: 删除已拒绝项目
    Given 用户已登录系统
    And 用户有一个 REJECTED 状态的项目
    When 用户点击该项目的"删除"按钮
    And 确认删除操作
    Then 系统应从数据库删除该项目
    And 项目从列表中移除

  Scenario: 不能删除已通过项目
    Given 用户已登录系统
    And 用户有一个 APPROVED 状态的项目
    Then 该项目的"删除"按钮应禁用或隐藏
    And 显示"已通过的项目无法删除"提示

  Scenario: 查看拒绝原因
    Given 用户已登录系统
    And 用户有一个被拒绝的项目
    And 拒绝原因为"项目描述不完整"
    When 用户访问 /showcase/my-projects 页面
    Then 系统应在该项目卡片上显示拒绝原因
    And 拒绝原因以醒目样式展示（如红色背景或警告图标）

  Scenario: 空状态显示
    Given 用户已登录系统
    And 用户从未提交过任何项目
    When 用户访问 /showcase/my-projects 页面
    Then 系统应显示"暂无提交记录"提示
    And 显示"提交第一个项目"按钮链接到提交页面

  Scenario: 分页加载
    Given 用户已登录系统
    And 用户提交了 25 个项目
    When 用户访问 /showcase/my-projects 页面
    Then 系统应显示前 12 个项目（第一页）
    And 显示分页控件
    And 总页数显示为 3 页
```

### 技术验收标准

#### 后端 API 实现

##### GET /api/v1/showcase/my-projects
- [ ] 创建 `my-projects-query.dto.ts` 用于分页参数验证
- [ ] 在 `showcase.service.ts` 添加 `getMyProjects()` 方法
- [ ] 在 `showcase.controller.ts` 添加 `@Get('my-projects')` 端点
- [ ] 使用 `@UseGuards(JwtAuthGuard)` 保护路由
- [ ] 使用 `@CurrentUser()` 获取当前用户 ID
- [ ] 只返回 `submittedBy` 等于当前用户 ID 的项目
- [ ] 支持分页（默认 page=1, pageSize=12）
- [ ] 包含拒绝原因 `rejectionReason` 字段
- [ ] 按创建时间倒序排列（最新的在前）

##### DELETE /api/v1/showcase/my-projects/:id
- [ ] 在 `showcase.service.ts` 添加 `deleteMyProject()` 方法
- [ ] 在 `showcase.controller.ts` 添加 `@Delete('my-projects/:id')` 端点
- [ ] 验证项目存在
- [ ] 验证项目归属当前用户（`submittedBy` 匹配）
- [ ] 检查项目状态：只允许删除 PENDING 或 REJECTED 状态
- [ ] APPROVED 状态的项目返回 403 Forbidden
- [ ] 删除成功返回 204 No Content

#### 前端页面实现

##### 我的 projects 页面组件
- [ ] 创建 `apps/web/src/pages/showcase/MyProjects.tsx`
- [ ] 使用 `useQuery` 获取我的项目列表
- [ ] 使用 ProtectedRoute 保护路由（需要登录）
- [ ] 显示项目卡片网格或列表布局
- [ ] 每个项目卡片显示：
  - 项目名称、描述、语言、分类
  - 审核状态徽章（PENDING/APPROVED/REJECTED）
  - 拒绝原因（如果被拒绝）
  - 提交时间
- [ ] 添加分页控件

##### 项目状态展示
- [ ] 创建状态徽章组件或使用 Badge 组件
- [ ] PENDING 状态：黄色徽章 "待审核"
- [ ] APPROVED 状态：绿色徽章 "已通过"
- [ ] REJECTED 状态：红色徽章 "已拒绝"

##### 删除功能
- [ ] 创建删除确认对话框（使用 AlertDialog 组件）
- [ ] APPROVED 状态的项目不显示删除按钮
- [ ] PENDING/REJECTED 状态的项目显示删除按钮
- [ ] 删除成功后刷新列表

##### 空状态
- [ ] 当用户没有项目时显示空状态
- [ ] 显示友好的提示信息
- [ ] 提供提交项目的链接

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
- ✅ **Story 8.6: 管理员审核界面** (已完成)
- 🔄 **Story 8.7: 我的项目管理** (当前)
- ⏳ **Story 8.8: 展示页菜单入口** (依赖 Story 8.4)

### Previous Story Intelligence

**从 Story 8.3 学到的项目提交模式**:
```typescript
// ShowcaseService 中已存在的方法
async submitProject(githubUrl: string, userId: string): Promise<ProjectPreview> {
  // 检查重复
  const existingProject = await this.prisma.project.findUnique({
    where: { githubUrl },
  });
  // 抓取 GitHub 信息
  const projectInfo = await this.githubFetcher.fetchProjectInfo(githubUrl);
  // 创建 PENDING 状态项目
  const project = await this.prisma.project.create({
    data: {
      status: ProjectStatus.PENDING,
      submittedBy: userId,
      // ...
    },
  });
}
```

**从 Story 8.6 学到的管理员审核模式**:
```typescript
// AdminService 中的审核方法
async approveProject(id: string, adminUserId: string): Promise<PendingProjectResponse> {
  // 验证项目状态
  if (project.status !== ProjectStatus.PENDING) {
    throw new BadRequestException(`Cannot approve project with status ${project.status}`);
  }
  // 更新状态
  const updated = await this.prismaProject.update({
    where: { id },
    data: {
      status: ProjectStatus.APPROVED,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  });
}

async rejectProject(id: string, rejectDto: RejectProjectDto, adminUserId: string) {
  // 记录拒绝原因
  const updated = await this.prismaProject.update({
    where: { id },
    data: {
      status: ProjectStatus.REJECTED,
      rejectionReason: rejectDto.rejectionReason,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  });
}
```

**Project 模型关键字段**（从 Story 8.1）:
```prisma
model Project {
  id              String          @id @default(cuid())
  repositoryName  String
  description     String          @db.Text
  owner           String
  stars           Int
  language        String?
  category        ProjectCategory
  topics          String[]
  suggestedTags   String[]
  screenshotUrl   String?         @db.Text
  githubUrl       String          @unique

  // 审核状态字段
  status          ProjectStatus   @default(PENDING)
  submittedBy     String
  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?         @db.Text  // 管理员拒绝原因

  // 关联关系
  submittedByUser User            @relation("SubmittedProjects", fields: [submittedBy], references: [id])
  reviewedByUser  User?           @relation("ReviewedProjects", fields: [reviewedBy], references: [id])

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status])
  @@index([submittedBy])  // 按提交者索引，用于"我的项目"查询
}
```

**从 Story 8.4 学到的前端展示页面模式**:
```tsx
// 展示页面的网格布局和状态管理
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

const { data, isLoading, error } = useQuery({
  queryKey: ['showcase-projects', { page, category, language, search, sort }],
  queryFn: () => showcaseApi.getProjects({ page, pageSize: 12, category, language, search, sort }),
});

// 使用 Skeleton 组件显示加载状态
if (isLoading) {
  return <div className="grid ...">{Array.from({ length: 6 }).map(...)}</div>;
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

#### 1.1 创建查询参数 DTO

```typescript
// apps/api/src/modules/showcase/dto/my-projects-query.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@bmad-starter-kit/shared';

/**
 * 我的 projects 列表查询 DTO
 */
export class MyProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
```

#### 1.2 更新 ShowcaseService

```typescript
// apps/api/src/modules/showcase/showcase.service.ts
// 在现有服务中添加新方法

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Project, ProjectStatus, Prisma } from '@prisma/client';

export interface MyProjectResponse {
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
  status: ProjectStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyProjectsListResponse {
  items: MyProjectResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

@Injectable()
export class ShowcaseService {
  // ... 现有代码

  /**
   * 获取当前用户提交的所有项目
   * @param userId 当前用户 ID
   * @param params 分页参数
   * @returns 用户的项目列表
   */
  async getMyProjects(
    userId: string,
    params: { page?: number; pageSize?: number },
  ): Promise<MyProjectsListResponse> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prismaProject.findMany({
        where: {
          submittedBy: userId, // 只查询当前用户提交的项目
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc', // 最新的在前
        },
      }),
      this.prismaProject.count({
        where: {
          submittedBy: userId,
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
   * 删除用户自己的项目
   * @param id 项目 ID
   * @param userId 当前用户 ID
   * @throws NotFoundException 如果项目不存在
   * @throws ForbiddenException 如果项目不属于当前用户
   * @throws BadRequestException 如果项目已通过审核
   */
  async deleteMyProject(id: string, userId: string): Promise<void> {
    // 1. 检查项目是否存在
    const project = await this.prismaProject.findUnique({
      where: { id },
      select: {
        id: true,
        submittedBy: true,
        status: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. 验证项目归属
    if (project.submittedBy !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    // 3. 检查项目状态（已通过的项目不能删除）
    if (project.status === ProjectStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot delete approved projects. Please contact support if needed.',
      );
    }

    // 4. 删除项目
    await this.prismaProject.delete({
      where: { id },
    });
  }
}
```

#### 1.3 更新 ShowcaseController

```typescript
// apps/api/src/modules/showcase/showcase.controller.ts
// 在现有控制器中添加新端点

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShowcaseService, MyProjectsListResponse } from './showcase.service';
import { MyProjectsQueryDto } from './dto/my-projects-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '@/common/decorators';

@Controller('v1/showcase')
@UseGuards(JwtAuthGuard) // 所有端点都需要登录
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  // ... 现有端点

  /**
   * 获取当前用户提交的所有项目
   * GET /api/v1/showcase/my-projects
   *
   * @param params 分页参数
   * @param user 当前认证用户
   * @returns 用户的项目列表
   */
  @Get('my-projects')
  async getMyProjects(
    @Query() params: MyProjectsQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{
    data: MyProjectsListResponse;
    statusCode: number;
    message: string;
  }> {
    const result = await this.showcaseService.getMyProjects(user.userId, params);
    return {
      data: result,
      statusCode: 200,
      message: '获取我的项目成功',
    };
  }

  /**
   * 删除用户自己的项目
   * DELETE /api/v1/showcase/my-projects/:id
   *
   * 只能删除 PENDING 或 REJECTED 状态的项目
   * APPROVED 状态的项目不能删除
   *
   * @param id 项目 ID
   * @param user 当前认证用户
   */
  @Delete('my-projects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.showcaseService.deleteMyProject(id, user.userId);
  }
}
```

### 2. 前端实现

#### 2.1 更新共享类型

```typescript
// packages/shared/src/types/showcase.types.ts

/**
 * 我的项目响应接口（包含审核状态）
 */
export interface MyProject {
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
  status: ProjectStatus; // PENDING | APPROVED | REJECTED
  rejectionReason: string | null; // 被拒绝时的原因
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 我的项目列表响应
 */
export interface MyProjectsListResponse {
  items: MyProject[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 项目状态枚举（用于前端显示）
 */
export enum ProjectStatusLabel {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * 项目状态标签映射
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};

/**
 * 项目状态颜色映射（用于 Badge variant）
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'default',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
};
```

#### 2.2 更新 API 客户端

```typescript
// apps/web/src/lib/api.ts
// 在现有文件中添加 showcaseApi 的方法

import type { MyProjectsListResponse } from '@bmad-starter-kit/shared';

// ... 现有 API

// Showcase API
export const showcaseApi = {
  // ... 现有方法（getProjects, submitProject 等）

  /**
   * 获取当前用户提交的所有项目（需要登录）
   * @param params 分页参数
   */
  getMyProjects: async (params?: { page?: number; pageSize?: number }) => {
    const response = await api.get<{
      data: MyProjectsListResponse;
      statusCode: number;
      message: string;
    }>('/api/v1/showcase/my-projects', { params });
    return response.data.data;
  },

  /**
   * 删除用户自己的项目（需要登录）
   * 只能删除 PENDING 或 REJECTED 状态的项目
   * @param id 项目 ID
   */
  deleteMyProject: async (id: string) => {
    const response = await api.delete(`/api/v1/showcase/my-projects/${id}`);
    return response.data;
  },
};
```

#### 2.3 创建我的 projects 页面

```typescript
// apps/web/src/pages/showcase/MyProjects.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@bmad-starter-kit/shared';
import { FolderOpen, Trash2, Github, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export default function MyProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });

  // 获取我的项目
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-projects', page],
    queryFn: () => showcaseApi.getMyProjects({ page, pageSize }),
  });

  // 删除项目
  const deleteMutation = useMutation({
    mutationFn: (id: string) => showcaseApi.deleteMyProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      toast.success('项目已删除');
      setDeleteDialog({ open: false, id: '' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '删除失败，请重试';
      toast.error(message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(deleteDialog.id);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
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

  // 空状态
  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">暂无提交记录</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          你还没有提交任何项目。提交你的第一个 BMAD 项目，与社区分享你的作品！
        </p>
        <Button onClick={() => navigate('/showcase')}>
          浏览展示项目
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">我的项目</h1>
            <p className="text-sm text-muted-foreground">
              共 {data.meta.total} 个提交
            </p>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="space-y-4">
        {data.items.map((project) => {
          const isApproved = project.status === 'APPROVED';
          const isRejected = project.status === 'REJECTED';

          return (
            <Card key={project.id} className={isRejected ? 'border-destructive/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* 项目信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{project.repositoryName}</h3>
                          <Badge variant={PROJECT_STATUS_COLORS[project.status]}>
                            {PROJECT_STATUS_LABELS[project.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          by {project.owner}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {project.description || '暂无描述'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                      {project.language && (
                        <Badge variant="secondary" className="font-normal">
                          {project.language}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {CATEGORY_LABELS[project.category] || project.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>

                    {/* 拒绝原因 */}
                    {isRejected && project.rejectionReason && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>拒绝原因：</strong> {project.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Button
                      variant="outline"
                      size="sm"
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

                    {/* 删除按钮 - APPROVED 状态禁用 */}
                    {!isApproved && (
                      <AlertDialog
                        open={deleteDialog.open && deleteDialog.id === project.id}
                        onOpenChange={(open) => setDeleteDialog({ open, id: project.id })}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除项目</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除项目 "{project.repositoryName}" 吗？
                              {!isApproved && (
                                <span className="block mt-2">
                                  删除后需要重新提交才能再次展示。
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteMutation.isPending}>
                              取消
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              disabled={deleteMutation.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteMutation.isPending ? '删除中...' : '确认删除'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {isApproved && (
                      <p className="text-xs text-muted-foreground">
                        已通过的项目无法删除
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
    </div>
  );
}
```

#### 2.4 添加路由配置

```typescript
// apps/web/src/App.tsx
import MyProjects from './pages/showcase/MyProjects';

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
              {/* 公开路由 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/showcase" element={<Showcase />} />

              {/* 受保护的路由 */}
              <Route path="/" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/showcase/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />

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

---

## 文件结构

```
apps/api/src/modules/showcase/
├── showcase.controller.ts             # 修改 - 添加 @Get('my-projects'), @Delete('my-projects/:id')
├── showcase.service.ts                # 修改 - 添加 getMyProjects(), deleteMyProject()
├── dto/
│   ├── submit-project.dto.ts          # (Story 8.3 已创建)
│   ├── get-projects.dto.ts            # (Story 8.4 已创建)
│   └── my-projects-query.dto.ts       # ✨ 本 story 创建
└── showcase.service.spec.ts           # 修改 - 添加新方法的测试

apps/web/src/
├── pages/
│   └── showcase/
│       ├── Showcase.tsx               # (Story 8.4 已创建)
│       └── MyProjects.tsx             # ✨ 本 story 创建
├── lib/
│   └── api.ts                         # 修改 - 添加 getMyProjects, deleteMyProject
└── App.tsx                            # 修改 - 添加 /showcase/my-projects 路由

packages/shared/src/types/
└── showcase.types.ts                  # 修改 - 添加 MyProject, PROJECT_STATUS_LABELS
```

---

## API 规范

### GET /api/v1/showcase/my-projects

**描述**: 获取当前用户提交的所有项目

**认证**: 需要登录 (Bearer Token)

**Query 参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `pageSize` | number | 12 | 每页数量 |

**响应** (200 OK):
```json
{
  "statusCode": 200,
  "message": "获取我的项目成功",
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
        "status": "APPROVED",
        "rejectionReason": null,
        "reviewedBy": "admin123",
        "reviewedAt": "2024-01-18T10:00:00.000Z",
        "createdAt": "2024-01-17T10:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      },
      {
        "id": "clyy...",
        "repositoryName": "another-project",
        "description": "Another BMAD project",
        "owner": "user",
        "stars": 56,
        "language": "Python",
        "category": "CLI",
        "topics": ["cli"],
        "suggestedTags": [],
        "screenshotUrl": null,
        "githubUrl": "https://github.com/user/another-project",
        "status": "REJECTED",
        "rejectionReason": "项目描述不完整，请补充更多技术细节",
        "reviewedBy": "admin123",
        "reviewedAt": "2024-01-18T11:00:00.000Z",
        "createdAt": "2024-01-17T11:00:00.000Z",
        "updatedAt": "2024-01-18T11:00:00.000Z"
      }
    ],
    "meta": {
      "total": 2,
      "page": 1,
      "pageSize": 12,
      "totalPages": 1
    }
  }
}
```

### DELETE /api/v1/showcase/my-projects/:id

**描述**: 删除用户自己的项目

**认证**: 需要登录 (Bearer Token)

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 项目 ID（CUID 格式） |

**响应** (204 No Content):
无响应体

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 401 | 未认证或 Token 无效 |
| 403 | 项目不属于当前用户 |
| 400 | 项目已通过审核，无法删除 |
| 404 | 项目不存在 |

---

## 测试要求

### 后端单元测试

```typescript
// apps/api/src/modules/showcase/showcase.service.spec.ts
describe('ShowcaseService - My Projects', () => {
  describe('getMyProjects', () => {
    it('should return only projects submitted by current user', async () => {
      const result = await service.getMyProjects('user-123', { page: 1, pageSize: 10 });
      result.items.forEach(p => {
        expect(p.submittedBy).toBe('user-123');
      });
    });

    it('should include rejection reason for rejected projects', async () => {
      const result = await service.getMyProjects('user-123', { page: 1, pageSize: 10 });
      const rejectedProjects = result.items.filter(p => p.status === 'REJECTED');
      rejectedProjects.forEach(p => {
        expect(p.rejectionReason).toBeDefined();
      });
    });

    it('should order by createdAt descending', async () => {
      const result = await service.getMyProjects('user-123', { page: 1, pageSize: 10 });
      const dates = result.items.map(p => new Date(p.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should support pagination', async () => {
      const result = await service.getMyProjects('user-123', { page: 2, pageSize: 5 });
      expect(result.meta.page).toBe(2);
      expect(result.meta.pageSize).toBe(5);
    });
  });

  describe('deleteMyProject', () => {
    it('should delete PENDING project', async () => {
      await service.deleteMyProject('pending-project-id', 'user-123');
      // 验证项目已删除
    });

    it('should delete REJECTED project', async () => {
      await service.deleteMyProject('rejected-project-id', 'user-123');
      // 验证项目已删除
    });

    it('should throw NotFoundException for non-existent project', async () => {
      await expect(
        service.deleteMyProject('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for other user project', async () => {
      await expect(
        service.deleteMyProject('other-user-project', 'user-123')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for APPROVED project', async () => {
      await expect(
        service.deleteMyProject('approved-project-id', 'user-123')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

### 前端组件测试

```typescript
// apps/web/src/pages/showcase/MyProjects.test.tsx
import { render, screen, waitFor } from '@/test/utils';
import { MyProjectsPage } from './MyProjects';

describe('MyProjects', () => {
  it('should render user projects', async () => {
    render(<MyProjectsPage />);
    await waitFor(() => {
      expect(screen.getByText('我的项目')).toBeInTheDocument();
    });
  });

  it('should show empty state when no projects', async () => {
    // Mock empty response
    render(<MyProjectsPage />);
    await waitFor(() => {
      expect(screen.getByText(/暂无提交记录/)).toBeInTheDocument();
    });
  });

  it('should display status badges', async () => {
    render(<MyProjectsPage />);
    // 验证状态徽章显示
  });

  it('should show rejection reason for rejected projects', async () => {
    render(<MyProjectsPage />);
    // 验证拒绝原因显示
  });

  it('should disable delete button for approved projects', async () => {
    render(<MyProjectsPage />);
    // 验证已通过项目的删除按钮被禁用
  });
});
```

---

## Common Pitfalls to Avoid

### ❌ 错误做法

1. **未验证项目归属**
   - 用户可以删除其他人的项目
   - ✅ 始终验证 `submittedBy` 是否等于当前用户 ID

2. **允许删除已通过项目**
   - 公开展示的项目被删除
   - ✅ APPROVED 状态的项目禁止删除，返回 400 错误

3. **不显示拒绝原因**
   - 用户不知道为什么被拒绝
   - ✅ 被拒绝的项目必须显示 `rejectionReason`

4. **缺少空状态引导**
   - 用户没有项目时页面空白
   - ✅ 显示友好的空状态和提交引导

5. **删除确认不清晰**
   - 用户误删项目
   - ✅ 使用 AlertDialog 进行二次确认

### ✅ 正确做法

1. 验证项目归属（`submittedBy === currentUserId`）
2. APPROVED 状态禁止删除
3. 被拒绝的项目必须显示拒绝原因
4. 提供友好的空状态和操作引导
5. 删除操作需要二次确认

---

## Dependencies

### Story 依赖
- ✅ **Story 8.1**: Project 模型已创建（包含 submittedBy、status、rejectionReason）
- ✅ **Story 8.3**: 项目提交 API 已实现（用户可以提交项目）
- ✅ **Story 8.6**: 管理员审核界面已实现（管理员可记录拒绝原因）

### 后续依赖
- ⏳ **Story 8.8**: 展示页菜单入口（可添加"我的项目"链接）

### 外部依赖
- `@tanstack/react-query` - 服务端状态管理
- `react-router-dom` - 路由
- `lucide-react` - 图标库
- `shadcn/ui` - UI 组件库

---

## 参考资料

### Epic 文档引用
- Story 8.7 完整定义: [Source: docs/planning-artifacts/epics.md#Story 8.7]
- Epic 8 总览: [Source: docs/planning-artifacts/epics.md#Epic 8]

### 前序 Story 文档
- Story 8.1 Project 模型: [Source: docs/implementation-artifacts/8-1-project-database-model.md]
- Story 8.3 项目提交 API: [Source: docs/implementation-artifacts/8-3-project-submission-api.md]
- Story 8.4 项目展示页面: [Source: docs/implementation-artifacts/8-4-project-showcase-page.md]
- Story 8.6 管理员审核界面: [Source: docs/implementation-artifacts/8-6-admin-review-interface.md]

### 项目上下文
- 项目结构和规范: [Source: docs/project-context.md]
- 后端架构: [Source: docs/planning-artifacts/architecture.md]

### 代码参考
- ShowcaseModule: [Source: apps/api/src/modules/showcase/showcase.module.ts]
- ShowcaseController: [Source: apps/api/src/modules/showcase/showcase.controller.ts]
- ShowcaseService: [Source: apps/api/src/modules/showcase/showcase.service.ts]
- API 客户端: [Source: apps/web/src/lib/api.ts]

---

**状态变更**: backlog → **ready-for-dev** → in-progress → review → done

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Implementation Summary

**Story 8.7 待实现 - 我的项目管理**

**技术要点:**
- 后端添加 GET /api/v1/showcase/my-projects 端点（需要登录）
- 后端添加 DELETE /api/v1/showcase/my-projects/:id 端点
- 验证项目归属（只能操作自己的项目）
- APPROVED 状态禁止删除
- 前端创建"我的项目"页面
- 显示审核状态徽章和拒绝原因
- 实现删除确认对话框

**安全要点:**
- 使用 JwtAuthGuard 保护所有端点
- 验证 submittedBy === currentUserId
- APPROVED 状态项目返回 400 禁止删除

---

## File List

### Files to Create
- `apps/api/src/modules/showcase/dto/my-projects-query.dto.ts`
- `apps/web/src/pages/showcase/MyProjects.tsx`

### Files to Modify
- `apps/api/src/modules/showcase/showcase.service.ts` - 添加 getMyProjects(), deleteMyProject()
- `apps/api/src/modules/showcase/showcase.controller.ts` - 添加 my-projects 端点
- `apps/api/src/modules/showcase/showcase.service.spec.ts` - 添加单元测试
- `apps/web/src/lib/api.ts` - 添加 getMyProjects(), deleteMyProject()
- `apps/web/src/App.tsx` - 添加 /showcase/my-projects 路由
- `packages/shared/src/types/showcase.types.ts` - 添加 MyProject 类型
