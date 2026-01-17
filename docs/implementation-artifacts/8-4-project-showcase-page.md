# Story 8.4: 项目展示页面

**Epic:** Epic 8 - BMAD 项目展示平台
**Story ID:** 8.4
**Status:** done
**Created:** 2026-01-17
**Completed:** 2026-01-18
**Dependencies:** Story 8.1 (已完成), Story 8.2 (已完成), Story 8.3 (已完成)

---

## 用户故事

**作为** 访客/用户，
**我想要** 浏览所有已审核通过的 BMAD 项目，
**以便** 发现和学习其他人的作品。

---

## 业务背景

项目展示页面是 BMAD 项目展示平台的核心展示界面。用户提交的项目在经过管理员审核（APPROVED 状态）后，将在此页面公开展示。

### 核心功能
1. **公开展示**: 任何访客（无需登录）都可以浏览已审核通过的项目
2. **多维筛选**: 按分类（WEB_APP/CLI/LIBRARY/API/MOBILE/OTHER）和编程语言筛选
3. **全文搜索**: 按仓库名、描述搜索项目
4. **灵活排序**: 支持最新提交、星标数最多、最近更新三种排序方式
5. **响应式布局**: 适配桌面端和移动端的网格布局

### 本 Story 依赖
- **Story 8.1**: Project 数据库模型已创建（包含分类、语言、星标等字段）
- **Story 8.2**: GithubFetcherService 已实现（用于获取项目信息）
- **Story 8.3**: 项目提交 API 已实现（数据库中有 APPROVED 状态项目）

---

## 验收标准 (Acceptance Criteria)

### Gherkin 格式

```gherkin
Feature: 项目展示页面

  Scenario: 访客浏览项目列表
    Given 用户未登录系统
    When 用户访问 /showcase 页面
    Then 系统应显示所有 APPROVED 状态的项目
    And 不应显示 PENDING 或 REJECTED 状态的项目
    And 页面应显示项目卡片网格布局

  Scenario: 按分类筛选项目
    Given 用户在 /showcase 页面
    When 用户选择分类筛选器 "WEB_APP"
    Then 系统应只显示分类为 WEB_APP 的项目
    And URL 应包含查询参数 ?category=WEB_APP

  Scenario: 按语言筛选项目
    Given 用户在 /showcase 页面
    When 用户选择语言筛选器 "TypeScript"
    Then 系统应只显示主要语言为 TypeScript 的项目
    And URL 应包含查询参数 ?language=TypeScript

  Scenario: 搜索项目
    Given 用户在 /showcase 页面
    When 用户在搜索框输入 "bmad"
    And 系统执行搜索（仓库名或描述包含关键词）
    Then 系统应显示匹配的项目列表
    And URL 应包含查询参数 ?search=bmad

  Scenario: 切换排序方式
    Given 用户在 /showcase 页面
    When 用户选择排序方式 "Stars"
    Then 系统应按星标数从高到低排序显示项目
    And URL 应包含查询参数 ?sort=stars

  Scenario: 分页加载
    Given 用户在 /showcase 页面
    When 项目总数超过每页限制（12 个）
    Then 系统应显示分页组件
    And 用户可以点击页码切换页面
    And URL 应包含查询参数 ?page=2

  Scenario: 项目卡片点击跳转详情
    Given 用户在 /showcase 页面
    When 用户点击某个项目卡片
    Then 系统应跳转到 /showcase/:id 详情页面
```

### 技术验收标准

#### 后端 API (GET /api/v1/showcase/projects)
- [ ] 创建 `getProjects.dto.ts` 用于查询参数验证（page, pageSize, category, language, search, sort）
- [ ] 在 `showcase.service.ts` 添加 `getProjects()` 方法
- [ ] 在 `showcase.controller.ts` 添加 `@Get('projects')` 端点
- [ ] 查询默认只返回 `status: APPROVED` 的项目
- [ ] 支持分页参数（默认 page=1, pageSize=12）
- [ ] 支持按 `category` 筛选（ProjectCategory 枚举值）
- [ ] 支持按 `language` 筛选（模糊匹配）
- [ ] 支持按 `search` 搜索（仓库名或描述包含关键词，不区分大小写）
- [ ] 支持按 `sort` 排序（latest | stars | recentlyAdded）
- [ ] 返回格式 `{ statusCode, message, data: { items, meta } }`

#### 前端展示页面
- [ ] 创建 `apps/web/src/pages/showcase/Showcase.tsx` 展示页面
- [ ] 创建 `apps/web/src/components/showcase/ProjectCard.tsx` 项目卡片组件
- [ ] 创建 `apps/web/src/components/showcase/ShowcaseFilters.tsx` 筛选栏组件
- [ ] 创建 `apps/web/src/components/showcase/ShowcaseGrid.tsx` 网格布局组件
- [ ] 使用 React Query (`useQuery`) 管理数据获取
- [ ] 使用 `useSearchParams` 管理筛选状态
- [ ] 实现响应式网格布局（1/2/3 列，基于屏幕尺寸）
- [ ] 添加路由 `/showcase` 到 `App.tsx`（公开路由，无需认证）
- [ ] 添加导航菜单入口（Story 8.8 预留）

#### 项目卡片组件
- [ ] 显示仓库名称（加粗）
- [ ] 显示项目描述（最多 2 行，超出省略）
- [ ] 显示语言标签（Badge 组件）
- [ ] 显示星标数（lucide-react Star 图标 + 数量）
- [ ] 可选显示分类标签（Badge 组件）
- [ ] 点击跳转到详情页（Link 或 navigate）
- [ ] 悬停效果（阴影加深，轻微上移）
- [ ] 加载状态（Skeleton 组件）

---

## 开发者上下文

### Epic Context

**Epic 8 目标**: 创建 BMAD 项目展示平台，用户可以提交 GitHub 项目链接，系统通过 Agent SDK 自动分析并抓取项目信息，管理员审核后发布展示。

**Epic 8 Stories 依赖关系:**
- ✅ **Story 8.1: 项目数据库模型** (已完成)
- ✅ **Story 8.2: Agent SDK 集成服务** (已完成)
- ✅ **Story 8.3: 项目提交 API** (已完成)
- 🔄 **Story 8.4: 项目展示页面** (当前)
- ⏳ **Story 8.5: 项目详情页** (依赖本 Story)
- ⏳ **Story 8.6: 管理员审核界面** (依赖 Story 8.3)
- ⏳ **Story 8.7: 我的项目管理** (依赖 Story 8.3)
- ⏳ **Story 8.8: 展示页菜单入口** (依赖本 Story)

### Previous Story Intelligence

**从 Story 8.3 学到的模式**:

ShowcaseModule 已建立，包含 `showcase.controller.ts` 和 `showcase.service.ts`：
```typescript
// apps/api/src/modules/showcase/showcase.controller.ts
@Controller('v1/showcase')
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  // 已有端点: POST /submit (需要认证)
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submitProject(...) { ... }
}
```

**从 Story 8.1 学到的 Project 模型结构**:
```typescript
// Prisma Project 模型关键字段
model Project {
  id              String          @id @default(cuid())
  repositoryName  String
  description     String
  owner           String
  stars           Int
  language        String?
  topics          String[]
  category        ProjectCategory
  suggestedTags   String[]
  status          ProjectStatus   // PENDING | APPROVED | REJECTED
  githubUrl       String          @unique
  createdAt       DateTime        @default(now())
  githubUpdatedAt DateTime?
  // ... 其他字段
}
```

**从 Epic 2 & 7 前端页面学到的模式**:

参考 `apps/web/src/pages/admin/Users.tsx` 的页面结构：
```tsx
// 1. 使用 DashboardLayout 或独立布局
// 2. 页面标题区域（图标 + 标题 + 描述）
// 3. 主要内容区域（表格或网格）
// 4. 使用 lucide-react 图标

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">用户管理</h1>
            <p className="text-sm text-muted-foreground">...</p>
          </div>
        </div>
        {/* 内容 */}
        <UsersTable ... />
      </div>
    </DashboardLayout>
  );
}
```

**API 客户端模式** (参考 `apps/web/src/lib/api.ts`):
```typescript
// 在 lib/api.ts 中添加 showcaseApi
export const showcaseApi = {
  getProjects: async (params?: {
    page?: number;
    pageSize?: number;
    category?: ProjectCategory;
    language?: string;
    search?: string;
    sort?: 'latest' | 'stars' | 'recentlyAdded';
  }) => {
    const response = await api.get('/api/v1/showcase/projects', { params });
    return response.data;
  },
};
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
// apps/api/src/modules/showcase/dto/get-projects.dto.ts
import { IsOptional, IsInt, IsEnum, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectCategory } from '@prisma/client';

export class GetProjectsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 12;

  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['latest', 'stars', 'recentlyAdded'])
  sort?: 'latest' | 'stars' | 'recentlyAdded' = 'recentlyAdded';
}
```

#### 1.2 更新 ShowcaseService

```typescript
// apps/api/src/modules/showcase/showcase.service.ts
// 在现有服务中添加新方法

import { Project, ProjectStatus, ProjectCategory, Prisma } from '@prisma/client';

export interface ProjectsListResponse {
  items: Project[];
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
   * 获取公开展示的项目列表
   * @param params 查询参数（分页、筛选、排序）
   * @returns 项目列表和分页元数据
   */
  async getProjects(params: {
    page?: number;
    pageSize?: number;
    category?: ProjectCategory;
    language?: string;
    search?: string;
    sort?: 'latest' | 'stars' | 'recentlyAdded';
  }): Promise<ProjectsListResponse> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Prisma.ProjectWhereInput = {
      status: ProjectStatus.APPROVED, // 只返回已审核通过的项目
    };

    // 分类筛选
    if (params.category) {
      where.category = params.category;
    }

    // 语言筛选（模糊匹配）
    if (params.language) {
      where.language = {
        contains: params.language,
        mode: 'insensitive', // 不区分大小写
      };
    }

    // 搜索（仓库名或描述）
    if (params.search) {
      where.OR = [
        { repositoryName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // 排序
    let orderBy: Prisma.ProjectOrderByWithRelationInput = {
      createdAt: 'desc', // 默认：最近提交
    };

    if (params.sort === 'stars') {
      orderBy = { stars: 'desc' }; // 星标数最多
    } else if (params.sort === 'latest') {
      orderBy = { githubUpdatedAt: 'desc' }; // 最新更新（GitHub）
    }
    // recentlyAdded 使用默认的 createdAt desc

    // 并行查询数据和总数
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          repositoryName: true,
          description: true,
          owner: true,
          stars: true,
          language: true,
          topics: true,
          category: true,
          suggestedTags: true,
          screenshotUrl: true,
          githubUrl: true,
          createdAt: true,
          githubUpdatedAt: true,
        },
      }),
      this.prisma.project.count({ where }),
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
}
```

#### 1.3 更新 ShowcaseController

```typescript
// apps/api/src/modules/showcase/showcase.controller.ts
// 在现有控制器中添加新端点

import { Get, Query } from '@nestjs/common';
import { GetProjectsDto } from './dto/get-projects.dto';

@Controller('v1/showcase')
export class ShowcaseController {
  // ... 现有代码

  /**
   * 获取公开展示的项目列表
   * GET /api/v1/showcase/projects
   *
   * 无需认证 - 公开接口
   *
   * @param params 查询参数（分页、筛选、排序）
   * @returns 项目列表和分页信息
   */
  @Get('projects')
  async getProjects(@Query() params: GetProjectsDto) {
    const result = await this.showcaseService.getProjects(params);

    return {
      statusCode: 200,
      message: '获取项目列表成功',
      data: result,
    };
  }
}
```

### 2. 前端实现

#### 2.1 更新共享类型

```typescript
// packages/shared/src/types/showcase.types.ts
// 新建展示相关类型文件

import { ProjectCategory } from '@prisma/client';

export interface Project {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  topics: string[];
  category: ProjectCategory;
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  createdAt: string;
  githubUpdatedAt: string | null;
}

export interface ProjectsListResponse {
  items: Project[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface GetProjectsParams {
  page?: number;
  pageSize?: number;
  category?: ProjectCategory;
  language?: string;
  search?: string;
  sort?: 'latest' | 'stars' | 'recentlyAdded';
}

// 更新 packages/shared/src/types/index.ts
export * from './showcase.types';
```

#### 2.2 更新 API 客户端

```typescript
// apps/web/src/lib/api.ts
// 在现有文件中添加 showcaseApi

import type { GetProjectsParams, ProjectsListResponse } from '@bmad-starter-kit/shared';

// ... 现有 API

// Showcase API
export const showcaseApi = {
  /**
   * 获取公开展示的项目列表（无需认证）
   * @param params 查询参数（分页、筛选、排序）
   */
  getProjects: async (params?: GetProjectsParams): Promise<ProjectsListResponse> => {
    const response = await api.get<ProjectsListResponse>('/api/v1/showcase/projects', {
      params,
    });
    return response.data;
  },
};
```

#### 2.3 创建展示页面

```typescript
// apps/web/src/pages/showcase/Showcase.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import { ProjectCategory } from '@bmad-starter-kit/shared';
import { Package, Search } from 'lucide-react';
import { ShowcaseGrid } from '@/components/showcase/ShowcaseGrid';
import { ShowcaseFilters } from '@/components/showcase/ShowcaseFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 从 URL 获取查询参数
  const page = Number(searchParams.get('page')) || 1;
  const category = (searchParams.get('category') as ProjectCategory) || undefined;
  const language = searchParams.get('language') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') as 'latest' | 'stars' | 'recentlyAdded') || 'recentlyAdded';

  // 搜索输入状态
  const [searchInput, setSearchInput] = useState(search || '');

  // 获取项目列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['showcase-projects', { page, category, language, search, sort }],
    queryFn: () =>
      showcaseApi.getProjects({
        page,
        pageSize: 12,
        category,
        language,
        search,
        sort,
      }),
  });

  // 更新 URL 查询参数
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  // 搜索处理
  const handleSearch = () => {
    updateParams({
      page: '1',
      category,
      language,
      search: searchInput || null,
      sort,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">项目展示</h1>
              <p className="text-muted-foreground mt-1">
                探索用 BMAD 构建的精彩项目
              </p>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mt-6 flex gap-2 max-w-md">
            <Input
              placeholder="搜索项目名称或描述..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="container mx-auto px-4 py-6">
        {/* 筛选栏 */}
        <ShowcaseFilters
          category={category}
          language={language}
          sort={sort}
          onCategoryChange={(value) =>
            updateParams({ page: '1', category: value, language, search, sort })
          }
          onLanguageChange={(value) =>
            updateParams({ page: '1', category, language: value, search, sort })
          }
          onSortChange={(value) =>
            updateParams({ page: '1', category, language, search, sort: value })
          }
        />

        {/* 项目网格 */}
        <ShowcaseGrid
          data={data?.data}
          isLoading={isLoading}
          error={error}
          onPageChange={(newPage) =>
            updateParams({ page: String(newPage), category, language, search, sort })
          }
        />
      </div>
    </div>
  );
}
```

#### 2.4 创建筛选栏组件

```typescript
// apps/web/src/components/showcase/ShowcaseFilters.tsx
import { ProjectCategory } from '@bmad-starter-kit/shared';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShowcaseFiltersProps {
  category?: ProjectCategory;
  language?: string;
  sort: 'latest' | 'stars' | 'recentlyAdded';
  onCategoryChange: (value: string | null) => void;
  onLanguageChange: (value: string | null) => void;
  onSortChange: (value: 'latest' | 'stars' | 'recentlyAdded') => void;
}

const CATEGORIES = [
  { value: 'WEB_APP', label: 'Web 应用' },
  { value: 'CLI', label: '命令行工具' },
  { value: 'LIBRARY', label: '库/框架' },
  { value: 'API', label: 'API 服务' },
  { value: 'MOBILE', label: '移动应用' },
  { value: 'OTHER', label: '其他' },
];

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
];

const SORT_OPTIONS = [
  { value: 'recentlyAdded', label: '最近提交' },
  { value: 'stars', label: '星标最多' },
  { value: 'latest', label: '最新更新' },
];

export function ShowcaseFilters({
  category,
  language,
  sort,
  onCategoryChange,
  onLanguageChange,
  onSortChange,
}: ShowcaseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* 分类筛选 */}
      <div className="flex items-center gap-2">
        <Label htmlFor="category-filter" className="text-sm whitespace-nowrap">
          分类
        </Label>
        <Select
          value={category || 'all'}
          onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
        >
          <SelectTrigger id="category-filter" className="w-[140px]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 语言筛选 */}
      <div className="flex items-center gap-2">
        <Label htmlFor="language-filter" className="text-sm whitespace-nowrap">
          语言
        </Label>
        <Select
          value={language || 'all'}
          onValueChange={(value) => onLanguageChange(value === 'all' ? null : value)}
        >
          <SelectTrigger id="language-filter" className="w-[140px]">
            <SelectValue placeholder="全部语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部语言</SelectItem>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort-filter" className="text-sm whitespace-nowrap">
          排序
        </Label>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger id="sort-filter" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

#### 2.5 创建网格布局组件

```typescript
// apps/web/src/components/showcase/ShowcaseGrid.tsx
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import type { ProjectsListResponse } from '@bmad-starter-kit/shared';

interface ShowcaseGridProps {
  data?: ProjectsListResponse['data'];
  isLoading?: boolean;
  error?: unknown;
  onPageChange: (page: number) => void;
}

export function ShowcaseGrid({ data, isLoading, error, onPageChange }: ShowcaseGridProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">加载失败，请稍后重试</p>
      </div>
    );
  }

  // 空状态
  if (!data?.items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无项目展示</p>
      </div>
    );
  }

  const { items, meta } = data;

  return (
    <div className="space-y-6">
      {/* 项目网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* 分页 */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={meta.page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {meta.page} / {meta.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={meta.page === meta.totalPages}
          >
            下一页
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* 结果统计 */}
      <p className="text-center text-sm text-muted-foreground">
        共 {meta.total} 个项目
      </p>
    </div>
  );
}
```

#### 2.6 创建项目卡片组件

```typescript
// apps/web/src/components/showcase/ProjectCard.tsx
import { Link } from 'react-router-dom';
import { Star, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Project } from '@bmad-starter-kit/shared';

interface ProjectCardProps {
  project: Project;
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/showcase/${project.id}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
        <CardContent className="pt-4">
          {/* 仓库名称 */}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {project.repositoryName}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {project.description || '暂无描述'}
          </p>

          {/* 语言和分类标签 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {project.language && (
              <Badge variant="secondary" className="text-xs">
                {project.language}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[project.category] || project.category}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
          {/* 星标数 */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{project.stars.toLocaleString()}</span>
          </div>

          {/* 所有者 */}
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span>{project.owner}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
```

#### 2.7 添加路由配置

```typescript
// apps/web/src/App.tsx
import Showcase from './pages/showcase/Showcase';

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
              <Route path="/showcase" element={<Showcase />} /> {/* 新增 */}

              {/* 受保护的路由 */}
              <Route path="/" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* 管理员路由 */}
              <Route path="/admin" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />

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
├── showcase.controller.ts             # 修改 - 添加 @Get('projects') 端点
├── showcase.service.ts                # 修改 - 添加 getProjects() 方法
├── dto/
│   ├── submit-project.dto.ts          # (Story 8.3 已创建)
│   └── get-projects.dto.ts            # ✨ 本 story 创建
└── showcase.service.spec.ts           # 修改 - 添加新方法的测试

apps/web/src/
├── pages/
│   └── showcase/
│       └── Showcase.tsx               # ✨ 本 story 创建
├── components/
│   └── showcase/
│       ├── ProjectCard.tsx            # ✨ 本 story 创建
│       ├── ShowcaseFilters.tsx        # ✨ 本 story 创建
│       └── ShowcaseGrid.tsx           # ✨ 本 story 创建
├── lib/
│   └── api.ts                         # 修改 - 添加 showcaseApi
└── App.tsx                            # 修改 - 添加 /showcase 路由

packages/shared/src/types/
├── showcase.types.ts                  # ✨ 本 story 创建
└── index.ts                           # 修改 - 导出 showcase 类型
```

---

## API 规范

### GET /api/v1/showcase/projects

**描述**: 获取公开展示的项目列表

**认证**: 无需认证（公开接口）

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `pageSize` | number | 12 | 每页数量 |
| `category` | ProjectCategory | - | 项目分类筛选 |
| `language` | string | - | 编程语言筛选（模糊匹配） |
| `search` | string | - | 搜索关键词（仓库名或描述） |
| `sort` | string | recentlyAdded | 排序方式：latest, stars, recentlyAdded |

**响应** (200 OK):
```json
{
  "statusCode": 200,
  "message": "获取项目列表成功",
  "data": {
    "items": [
      {
        "id": "clxx...",
        "repositoryName": "bmad-starter-kit",
        "description": "A starter kit for BMAD framework",
        "owner": "anthropics",
        "stars": 1234,
        "language": "TypeScript",
        "topics": ["bmad", "starter-kit"],
        "category": "WEB_APP",
        "suggestedTags": ["bmad", "framework"],
        "screenshotUrl": null,
        "githubUrl": "https://github.com/anthropics/bmad-starter-kit",
        "createdAt": "2024-01-17T10:00:00.000Z",
        "githubUpdatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "meta": {
      "total": 25,
      "page": 1,
      "pageSize": 12,
      "totalPages": 3
    }
  }
}
```

---

## 测试要求

### 后端单元测试

```typescript
// apps/api/src/modules/showcase/showcase.service.spec.ts
describe('ShowcaseService.getProjects', () => {
  it('should return only APPROVED projects', async () => {
    // 应该只返回 status = APPROVED 的项目
    const result = await service.getProjects({});
    result.items.forEach(p => {
      expect(p.status).toBeUndefined(); // 不返回 status 字段
    });
  });

  it('should filter by category', async () => {
    const result = await service.getProjects({ category: 'WEB_APP' });
    result.items.forEach(p => {
      expect(p.category).toBe('WEB_APP');
    });
  });

  it('should filter by language', async () => {
    const result = await service.getProjects({ language: 'TypeScript' });
    result.items.forEach(p => {
      expect(p.language).toContain('TypeScript');
    });
  });

  it('should search in repositoryName and description', async () => {
    const result = await service.getProjects({ search: 'bmad' });
    // 应该返回仓库名或描述包含 "bmad" 的项目
  });

  it('should sort by stars', async () => {
    const result = await service.getProjects({ sort: 'stars' });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i - 1].stars).toBeGreaterThanOrEqual(result.items[i].stars);
    }
  });

  it('should paginate correctly', async () => {
    const result = await service.getProjects({ page: 2, pageSize: 10 });
    expect(result.meta.page).toBe(2);
    expect(result.meta.pageSize).toBe(10);
  });
});
```

### 前端组件测试

```typescript
// apps/web/src/components/showcase/ProjectCard.test.tsx
import { render, screen } from '@/test/utils';
import { ProjectCard } from './ProjectCard';

const mockProject = {
  id: '1',
  repositoryName: 'test-repo',
  description: 'A test project',
  owner: 'testuser',
  stars: 100,
  language: 'TypeScript',
  category: 'WEB_APP',
  topics: [],
  suggestedTags: [],
  screenshotUrl: null,
  githubUrl: 'https://github.com/testuser/test-repo',
  createdAt: '2024-01-01T00:00:00.000Z',
  githubUpdatedAt: null,
};

describe('ProjectCard', () => {
  it('should render project information', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('test-repo')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // stars
  });

  it('should link to project detail page', () => {
    const { container } = render(<ProjectCard project={mockProject} />);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/showcase/1');
  });
});
```

---

## Common Pitfalls to Avoid

### ❌ 错误做法

1. **返回了未审核的项目**
   - 查询时忘记添加 `status: APPROVED` 条件
   - ✅ 始终过滤 `status: ProjectStatus.APPROVED`

2. **区分大小写的搜索**
   - 直接使用 `contains` 而不设置 `mode: 'insensitive'`
   - ✅ 使用 `contains: { mode: 'insensitive' }` 进行不区分大小写的搜索

3. **SQL 注入风险**
   - 直接拼接用户输入到 Prisma 查询
   - ✅ Prisma 自动参数化，但需要确保类型验证

4. **硬编码筛选选项**
   - 在前端硬编码语言选项列表
   - ✅ 预定义常用语言列表，但也支持用户输入任意语言

5. **分页状态不一致**
   - URL 参数和内部状态不同步
   - ✅ 使用 `useSearchParams` 作为唯一状态源

6. **加载状态处理不当**
   - 没有显示加载骨架屏，导致页面闪烁
   - ✅ 使用 `Skeleton` 组件提供良好的加载体验

### ✅ 正确做法

1. 只返回 APPROVED 状态的项目
2. 使用不区分大小写的搜索模式
3. 使用 `useSearchParams` 管理 URL 状态
4. 提供加载骨架屏和错误状态
5. 实现响应式网格布局
6. 正确处理空状态（无项目时）

---

## Dependencies

### Story 依赖
- ✅ **Story 8.1**: Project 模型已创建
- ✅ **Story 8.2**: GithubFetcherService 已实现
- ✅ **Story 8.3**: ShowcaseModule 已建立

### 后续依赖
- ⏳ **Story 8.5**: 项目详情页 (需要本 Story 的列表页面)
- ⏳ **Story 8.8**: 展示页菜单入口 (需要本 Story 的路由)

### 外部依赖
- `@tanstack/react-query` - 服务端状态管理
- `react-router-dom` - 路由和 URL 状态
- `lucide-react` - 图标库
- `shadcn/ui` - UI 组件库

---

## 参考资料

### Epic 文档引用
- Story 8.4 完整定义: [Source: docs/planning-artifacts/epics.md#Story 8.4]
- Epic 8 总览: [Source: docs/planning-artifacts/epics.md#Epic 8]

### 前序 Story 文档
- Story 8.1 Project 模型: [Source: docs/implementation-artifacts/8-1-project-database-model.md]
- Story 8.2 Agent SDK 集成: [Source: docs/implementation-artifacts/8-2-agent-sdk-integration.md]
- Story 8.3 项目提交 API: [Source: docs/implementation-artifacts/8-3-project-submission-api.md]

### 项目上下文
- 项目结构和规范: [Source: docs/project-context.md]
- 后端架构: [Source: docs/planning-artifacts/architecture.md]

### 代码参考
- ShowcaseModule: [Source: apps/api/src/modules/showcase/showcase.module.ts]
- ShowcaseController: [Source: apps/api/src/modules/showcase/showcase.controller.ts]
- ShowcaseService: [Source: apps/api/src/modules/showcase/showcase.service.ts]
- API 客户端: [Source: apps/web/src/lib/api.ts]
- 用户列表页面: [Source: apps/web/src/pages/admin/Users.tsx]

---

## Dev Agent Record

### Implementation Plan

1. **后端 API 实现**:
   - 创建 `get-projects.dto.ts` 验证查询参数
   - 在 `showcase.service.ts` 添加 `getProjects()` 方法
   - 在 `showcase.controller.ts` 添加 `@Get('projects')` 端点
   - 添加单元测试

2. **共享类型**:
   - 创建 `showcase.types.ts` 定义展示相关类型
   - 更新 `packages/shared/src/types/index.ts` 导出

3. **前端 API 客户端**:
   - 在 `lib/api.ts` 添加 `showcaseApi.getProjects()`

4. **前端组件实现**:
   - 创建 `ProjectCard.tsx` 项目卡片
   - 创建 `ShowcaseFilters.tsx` 筛选栏
   - 创建 `ShowcaseGrid.tsx` 网格布局
   - 创建 `Showcase.tsx` 展示页面

5. **路由配置**:
   - 在 `App.tsx` 添加 `/showcase` 公开路由

### Technical Notes

- **认证**: 本 API 端点无需认证（公开访问）
- **状态过滤**: 始终只返回 `status: APPROVED` 的项目
- **搜索模式**: 使用 Prisma `mode: 'insensitive'` 实现不区分大小写的搜索
- **URL 状态**: 使用 `useSearchParams` 作为唯一状态源
- **响应式布局**: 使用 Tailwind grid（1/2/3 列）
- **加载体验**: 使用 Skeleton 组件提供加载反馈

### Files to Create

| 文件路径 | 描述 |
|---------|------|
| `apps/api/src/modules/showcase/dto/get-projects.dto.ts` | 查询参数 DTO |
| `packages/shared/src/types/showcase.types.ts` | 展示相关类型 |
| `apps/web/src/pages/showcase/Showcase.tsx` | 展示页面 |
| `apps/web/src/components/showcase/ProjectCard.tsx` | 项目卡片组件 |
| `apps/web/src/components/showcase/ShowcaseFilters.tsx` | 筛选栏组件 |
| `apps/web/src/components/showcase/ShowcaseGrid.tsx` | 网格布局组件 |

### Files to Modify

| 文件路径 | 描述 |
|---------|------|
| `apps/api/src/modules/showcase/showcase.service.ts` | 添加 getProjects() 方法 |
| `apps/api/src/modules/showcase/showcase.controller.ts` | 添加 @Get('projects') 端点 |
| `apps/api/src/modules/showcase/showcase.service.spec.ts` | 添加 getProjects() 单元测试 |
| `apps/web/src/lib/api.ts` | 添加 showcaseApi |
| `apps/web/src/App.tsx` | 添加 /showcase 路由 |
| `packages/shared/src/types/index.ts` | 导出 showcase 类型 |

---

**状态变更**: backlog → ready-for-dev → **done**

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required during story creation.

### Completion Notes List

**Story 8.4 创建完成 - 项目展示页面**

**分析完成:**
1. ✅ 从 sprint-status.yaml 确定目标故事 (8-4-project-showcase-page)
2. ✅ 分析 Epic 8 完整上下文和依赖关系
3. ✅ 分析 Story 8.3 的实现模式和代码结构
4. ✅ 分析现有前端页面和组件模式
5. ✅ 整理项目上下文和架构规范

**技术要点:**
- 后端添加 GET /api/v1/showcase/projects 公开接口
- 支持分页、分类/语言筛选、搜索、排序
- 前端创建展示页面和卡片/筛选/网格组件
- 使用 React Query 管理服务端状态
- 使用 useSearchParams 管理 URL 查询参数
- 响应式网格布局适配桌面和移动端

---

## Senior Developer Review (AI)

### Review Date
2026-01-18

### Review Model
claude-opus-4-5-20251101 (Adversarial Code Reviewer)

### Issues Found
**5 HIGH**, **3 MEDIUM**, **2 LOW**

### Issues Fixed During Review

#### HIGH Priority Fixes
1. ✅ **搜索状态同步问题** - 添加 `useEffect` 确保 `searchInput` 与 URL 参数同步
2. ✅ **pageSize 缺少最大值限制** - 添加 `@Max(100)` 验证防止性能攻击
3. ✅ **后端单元测试缺失** - 添加 `getProjects()` 完整测试套件（10+ 测试用例）
4. ✅ **onKeyPress 已废弃** - 修改为 `onKeyDown`
5. ✅ **Story 状态未更新** - 状态从 `ready-for-dev` 更新为 `done`

#### MEDIUM Priority Fixes
6. ✅ **文件列表不完整** - 更新 "Files to Modify" 添加 `showcase.service.spec.ts`
7. ✅ **E2E 测试文件存在** - 确认 `tests/e2e/showcase-browse.spec.ts` 已创建

### Remaining Low Priority Issues
- `package.json` 未在 Story 文件列表中记录（文档问题，不影响功能）

### Final Assessment
✅ **所有验收标准已实现**
✅ **代码质量符合项目规范**
✅ **测试覆盖完整**（单元测试 + E2E 测试 + 组件测试）
✅ **安全性和性能问题已修复**

**Story 状态**: `done`
