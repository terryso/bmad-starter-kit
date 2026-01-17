# Story 8.3: 项目提交 API

**Epic:** Epic 8 - BMAD 项目展示平台
**Story ID:** 8.3
**Status:** done
**Created:** 2026-01-17
**Dependencies:** Story 8.1 (已完成), Story 8.2 (已完成)

---

## 用户故事

**作为** 注册用户，
**我想要** 提交我的 BMAD 项目 GitHub 链接，
**以便** 系统自动抓取信息并提交审核，最终在展示平台上展示我的作品。

---

## 业务背景

BMAD 项目展示平台允许用户提交自己使用 BMAD 框架开发的 GitHub 项目。本 Story 实现项目提交流程的核心 API：

1. **用户体验优化**: 用户只需粘贴 GitHub URL，系统自动抓取项目信息
2. **审核机制**: 提交的项目默认为 PENDING 状态，需管理员审核后才能公开展示
3. **防重复**: 同一 GitHub URL 只能提交一次
4. **速率限制**: 防止用户滥用提交接口

本 Story 依赖前序 Stories:
- **Story 8.1**: Project 数据库模型已创建
- **Story 8.2**: GithubFetcherService 已实现，可调用 Claude Agent SDK 抓取项目信息

---

## 验收标准 (Acceptance Criteria)

### Gherkin 格式

```gherkin
Feature: 项目提交 API

  Scenario: 成功提交项目
    Given 用户已登录系统
    And 用户提交了一个有效的 GitHub URL
    When 系统调用 POST /api/v1/showcase/submit
    And GithubFetcherService 成功抓取项目信息
    And GitHub URL 未被提交过
    Then 系统应返回 HTTP 201 状态码
    And 项目应保存到数据库，状态为 PENDING
    And 响应应包含抓取的项目预览信息
    And submittedBy 字段应为当前用户 ID

  Scenario: GitHub URL 格式验证
    Given 用户已登录系统
    When 用户提交了无效的 GitHub URL
    Then 系统应返回 HTTP 400 状态码
    And 错误消息应说明正确的 URL 格式

  Scenario: 重复提交检测
    Given 用户已登录系统
    And 某个 GitHub URL 已被提交过
    When 用户尝试提交相同的 GitHub URL
    Then 系统应返回 HTTP 409 状态码
    And 错误消息应说明项目已存在

  Scenario: 未认证用户访问
    Given 用户未登录系统
    When 用户尝试访问 POST /api/v1/showcase/submit
    Then 系统应返回 HTTP 401 状态码
    And 错误消息应说明需要先登录

  Scenario: 速率限制保护
    Given 用户已登录系统
    And 用户在短时间内多次提交项目
    When 用户超过速率限制（3次/分钟）
    Then 系统应返回 HTTP 429 状态码
    And 错误消息应说明速率限制

  Scenario: Agent SDK 调用失败
    Given 用户已登录系统
    And 用户提交了有效的 GitHub URL
    But GithubFetcherService 调用失败（超时或 API 错误）
    Then 系统应返回 HTTP 500 状态码
    And 错误消息应说明抓取失败
    And 不应创建任何数据库记录
```

### 技术验收标准

- [x] `showcase.controller.ts` 创建在 `apps/api/src/modules/showcase/` 目录
- [x] `showcase.service.ts` 创建在 `apps/api/src/modules/showcase/` 目录
- [x] `submit-project.dto.ts` 创建用于验证 GitHub URL 输入
- [x] POST /api/v1/showcase/submit 端点正确实现
- [x] 使用 `@UseGuards(JwtAuthGuard)` 保护路由
- [x] 使用 `@Throttle()` 装饰器实现速率限制（3次/分钟）
- [x] 使用 `@CurrentUser()` 装饰器获取当前用户 ID
- [x] 调用 `GithubFetcherService.fetchProjectInfo()` 获取项目信息
- [x] 使用 Prisma Client 创建 Project 记录，状态默认为 PENDING
- [x] 检查 `githubUrl` 唯一性，重复时返回 409 ConflictException
- [x] 统一响应格式 `ApiResponse<ProjectPreview>`
- [x] 添加单元测试覆盖核心逻辑

---

## 开发者上下文

### Epic Context

**Epic 8 目标**: 创建 BMAD 项目展示平台，用户可以提交 GitHub 项目链接，系统通过 Agent SDK 自动分析并抓取项目信息，管理员审核后发布展示。

**Epic 8 Stories 依赖关系:**
- ✅ **Story 8.1: 项目数据库模型** (已完成)
- ✅ **Story 8.2: Agent SDK 集成服务** (已完成)
- 🔄 **Story 8.3: 项目提交 API** (当前)
- ⏳ **Story 8.4: 项目展示页面** (依赖 Story 8.3)
- ⏳ **Story 8.5: 项目详情页** (依赖 Story 8.4)
- ⏳ **Story 8.6: 管理员审核界面** (依赖 Story 8.3)
- ⏳ **Story 8.7: 我的项目管理** (依赖 Story 8.3)
- ⏳ **Story 8.8: 展示页菜单入口** (依赖 Story 8.4)

### Previous Story Intelligence

**从 Story 8.1 学到的模式**:

Project 模型结构已建立，重要字段：
```typescript
// Prisma Project 模型关键字段
{
  id: string;                    // cuid 主键
  githubUrl: string;             // @unique 唯一约束
  status: ProjectStatus;         // PENDING | APPROVED | REJECTED
  submittedBy: string;           // 提交者用户 ID
  repositoryName: string;        // GitHub 仓库名
  description: string;           // 项目描述
  owner: string;                 // GitHub 所有者
  stars: number;                 // 星标数
  language: string | null;       // 编程语言
  category: ProjectCategory;     // 项目分类
  // ... 其他字段
}
```

**从 Story 8.2 学到的模式**:

`GithubFetcherService` 已实现，使用方法：
```typescript
// 注入服务
constructor(private githubFetcher: GithubFetcherService) {}

// 调用抓取
const projectInfo = await this.githubFetcher.fetchProjectInfo(githubUrl);
// 返回类型: GitHubProjectResponse

// 可能抛出的异常:
// - InvalidGitHubUrlException (400)
// - AgentTimeoutException (408)
// - InvalidResponseException (400)
// - InternalServerErrorException (500)
```

**从 Epic 2 & 7 学到的模式**:

认证和授权模式已建立：
```typescript
// JWT 认证守卫
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)

// 当前用户装饰器
import { CurrentUser, CurrentUserData } from '@/common/decorators';
@CurrentUser() user: CurrentUserData
// { userId: string; email: string }

// 速率限制
import { Throttle } from '@nestjs/throttler';
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3次/分钟

// 统一响应格式
return {
  statusCode: HttpStatus.CREATED,
  message: '提交成功',
  data: projectData,
};
```

### 项目技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | NestJS |
| ORM | Prisma |
| 数据库 | PostgreSQL (Supabase) |
| 认证 | JWT (@nestjs/jwt) |
| 速率限制 | @nestjs/throttler |
| 验证 | class-validator |

---

## 技术实现要求

### 1. 更新 ShowcaseModule

需要在 `showcase.module.ts` 中添加新的 Controller 和 Service：

```typescript
// apps/api/src/modules/showcase/showcase.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GithubFetcherService } from './github-fetcher.service';
import { ShowcaseService } from './showcase.service';
import { ShowcaseController } from './showcase.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule, // 用于速率限制
  ],
  controllers: [ShowcaseController],
  providers: [
    GithubFetcherService,
    ShowcaseService,
  ],
  exports: [GithubFetcherService, ShowcaseService],
})
export class ShowcaseModule {}
```

### 2. 创建 SubmitProjectDto

```typescript
// apps/api/src/modules/showcase/dto/submit-project.dto.ts
import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * DTO for submitting a GitHub project URL
 */
export class SubmitProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'GitHub URL 不能为空' })
  @Matches(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\/]+\/[^\/\.]+(?:\.git)?/,
    {
      message: '无效的 GitHub URL 格式，正确格式: https://github.com/owner/repo',
    }
  )
  githubUrl!: string;
}
```

### 3. 创建 ShowcaseService

```typescript
// apps/api/src/modules/showcase/showcase.service.ts
import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GithubFetcherService } from './github-fetcher.service';
import { GitHubProjectResponse } from './schemas/project-response.schema';
import { Project, ProjectStatus } from '@prisma/client';

/**
 * Response data after project submission
 */
export interface ProjectPreview extends Omit<
  Project,
  'submittedBy' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason'
> {}

@Injectable()
export class ShowcaseService {
  private readonly logger = new Logger(ShowcaseService.name);

  constructor(
    private prisma: PrismaService,
    private githubFetcher: GithubFetcherService,
  ) {}

  /**
   * Submit a GitHub project for review
   * @param githubUrl GitHub repository URL
   * @param userId Current user ID from JWT
   * @returns Created project with PENDING status
   * @throws ConflictException if project already exists
   */
  async submitProject(
    githubUrl: string,
    userId: string,
  ): Promise<ProjectPreview> {
    this.logger.log(`User ${userId} submitting project: ${githubUrl}`);

    // 1. Check if project already exists
    const existingProject = await this.prisma.project.findUnique({
      where: { githubUrl },
    });

    if (existingProject) {
      this.logger.warn(`Project already exists: ${githubUrl}`);
      throw new ConflictException(
        '该项目已被提交，请勿重复提交'
      );
    }

    // 2. Fetch project info from GitHub using Agent SDK
    const projectInfo = await this.githubFetcher.fetchProjectInfo(githubUrl);

    // 3. Create project record in database
    const project = await this.prisma.project.create({
      data: {
        // GitHub info from Agent SDK
        repositoryName: projectInfo.repositoryName,
        description: projectInfo.description,
        owner: projectInfo.owner,
        stars: projectInfo.stars,
        language: projectInfo.language,
        topics: projectInfo.topics,
        githubUpdatedAt: projectInfo.updatedAt
          ? new Date(projectInfo.updatedAt)
          : null,
        homepageUrl: projectInfo.homepageUrl,
        license: projectInfo.license,
        githubUrl: projectInfo.githubUrl,

        // Display info from Agent SDK
        category: projectInfo.category,
        suggestedTags: projectInfo.suggestedTags,

        // Submission metadata
        status: ProjectStatus.PENDING,
        submittedBy: userId,
      },
    });

    this.logger.log(`Project created successfully: ${project.id}`);

    // 4. Return project preview (exclude sensitive fields)
    const { submittedBy, reviewedBy, reviewedAt, rejectionReason, ...preview } =
      project;

    return preview;
  }

  /**
   * Check if a GitHub URL has already been submitted
   * @param githubUrl GitHub repository URL
   * @returns true if project exists, false otherwise
   */
  async isProjectSubmitted(githubUrl: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { githubUrl },
    });
    return !!project;
  }
}
```

### 4. 创建 ShowcaseController

```typescript
// apps/api/src/modules/showcase/showcase.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Throttle,
} from '@nestjs/common';
import { ShowcaseService, ProjectPreview } from './showcase.service';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '@/common/decorators';
import { ApiResponse } from '@bmad-starter-kit/shared';

/**
 * Showcase Controller
 * Base path: /api/v1/showcase
 *
 * Handles project submission and showcase-related endpoints
 */
@Controller('v1/showcase')
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  /**
   * Submit a GitHub project for review
   * POST /api/v1/showcase/submit
   *
   * Rate limited: 3 submissions per minute per user
   *
   * @param dto GitHub URL to submit
   * @param user Current authenticated user from JWT
   * @returns Created project with PENDING status
   * @throws 401 if not authenticated
   * @throws 400 if URL format is invalid
   * @throws 409 if project already exists
   * @throws 429 if rate limit exceeded
   * @throws 500 if GitHub fetch fails
   */
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 3,        // 3 submissions
      ttl: 60000,      // per 60 seconds (1 minute)
    },
  })
  async submitProject(
    @Body() dto: SubmitProjectDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponse<ProjectPreview>> {
    const project = await this.showcaseService.submitProject(
      dto.githubUrl,
      user.userId,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '项目提交成功，等待管理员审核',
      data: project,
    };
  }
}
```

### 5. 在 app.module.ts 中注册 ShowcaseModule

确保 `ShowcaseModule` 已在主模块中注册：

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ShowcaseModule } from './modules/showcase/showcase.module';

@Module({
  imports: [
    // ... other modules
    ShowcaseModule,
  ],
})
export class AppModule {}
```

### 6. 在 PrismaModule 中导出 PrismaService

确保 `PrismaService` 可以被其他模块注入：

```typescript
// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> 注意: `@Global()` 装饰器使 PrismaModule 在全局可用，无需在每个模块中导入。

---

## 文件结构

```
apps/api/src/modules/showcase/
├── showcase.module.ts                 # 模块定义 (修改 - 添加 controller, service, PrismaModule)
├── showcase.controller.ts             # ✨ 本 story 创建
├── showcase.service.ts                # ✨ 本 story 创建
├── github-fetcher.service.ts          # (Story 8.2 已创建)
├── dto/
│   ├── submit-project.dto.ts          # ✨ 本 story 创建
│   └── github-url.dto.ts              # (Story 8.2 已创建)
├── schemas/
│   └── project-response.schema.ts     # (Story 8.2 已创建)
└── exceptions/
    ├── github-url.exception.ts        # (Story 8.2 已创建)
    ├── agent-timeout.exception.ts     # (Story 8.2 已创建)
    ├── invalid-response.exception.ts  # (Story 8.2 已创建)
    └── index.ts                       # (Story 8.2 已创建)
```

---

## API 规范

### POST /api/v1/showcase/submit

**描述**: 提交 GitHub 项目链接用于审核展示

**认证**: 需要登录 (Bearer Token)

**速率限制**: 3 次/分钟/用户

**请求体**:
```json
{
  "githubUrl": "https://github.com/owner/repo"
}
```

**响应** (201 Created):
```json
{
  "statusCode": 201,
  "message": "项目提交成功，等待管理员审核",
  "data": {
    "id": "clxx...",
    "repositoryName": "bmad-starter-kit",
    "description": "A starter kit for BMAD framework",
    "owner": "anthropics",
    "stars": 1234,
    "language": "TypeScript",
    "topics": ["bmad", "starter-kit"],
    "githubUpdatedAt": "2024-01-15T10:30:00.000Z",
    "homepageUrl": "https://example.com",
    "license": "MIT",
    "githubUrl": "https://github.com/anthropics/bmad-starter-kit",
    "category": "WEB_APP",
    "suggestedTags": ["bmad", "framework"],
    "screenshotUrl": null,
    "status": "PENDING",
    "createdAt": "2024-01-17T10:00:00.000Z",
    "updatedAt": "2024-01-17T10:00:00.000Z"
  }
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | URL 格式无效 |
| 401 | 未认证或 Token 无效 |
| 409 | 项目已存在 |
| 429 | 超过速率限制 |
| 500 | GitHub 抓取失败 |

---

## 测试要求

### 单元测试

创建 `showcase.service.spec.ts`：

```typescript
describe('ShowcaseService', () => {
  let service: ShowcaseService;
  let prisma: DeepMockProxy<PrismaService>;
  let githubFetcher: DeepMockProxy<GithubFetcherService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ShowcaseService,
        {
          provide: PrismaService,
          useValue: createMock<DeepMockProxy<PrismaService>>(),
        },
        {
          provide: GithubFetcherService,
          useValue: createMock<DeepMockProxy<GithubFetcherService>>(),
        },
      ],
    }).compile();

    service = module.get(ShowcaseService);
    prisma = module.get(PrismaService);
    githubFetcher = module.get(GithubFetcherService);
  });

  describe('submitProject', () => {
    const mockUserId = 'user-123';
    const mockGithubUrl = 'https://github.com/owner/repo';
    const mockProjectInfo: GitHubProjectResponse = {
      repositoryName: 'test-repo',
      description: 'Test description',
      owner: 'owner',
      stars: 100,
      language: 'TypeScript',
      topics: ['test'],
      updatedAt: '2024-01-01T00:00:00Z',
      homepageUrl: null,
      license: 'MIT',
      category: 'WEB_APP',
      suggestedTags: ['test'],
    };

    it('should create project successfully', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      githubFetcher.fetchProjectInfo.mockResolvedValue(mockProjectInfo);
      prisma.project.create.mockResolvedValue({
        id: 'project-123',
        ...mockProjectInfo,
        status: 'PENDING',
        submittedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        // ... other fields
      } as any);

      const result = await service.submitProject(mockGithubUrl, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { githubUrl: mockGithubUrl },
      });
      expect(githubFetcher.fetchProjectInfo).toHaveBeenCalledWith(mockGithubUrl);
      expect(prisma.project.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if project exists', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'existing-project',
      } as any);

      await expect(
        service.submitProject(mockGithubUrl, mockUserId)
      ).rejects.toThrow(ConflictException);
    });
  });
});
```

创建 `showcase.controller.spec.ts`：

```typescript
describe('ShowcaseController', () => {
  let controller: ShowcaseController;
  let service: DeepMockProxy<ShowcaseService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ShowcaseController],
      providers: [
        {
          provide: ShowcaseService,
          useValue: createMock<DeepMockProxy<ShowcaseService>>(),
        },
      ],
    }).compile();

    controller = module.get(ShowcaseController);
    service = module.get(ShowcaseService);
  });

  describe('submitProject', () => {
    it('should submit project successfully', async () => {
      const mockUser = { userId: 'user-123', email: 'test@example.com' };
      const mockDto = { githubUrl: 'https://github.com/owner/repo' };
      const mockProject = {
        id: 'project-123',
        repositoryName: 'test-repo',
        status: 'PENDING',
        // ... other fields
      } as any;

      service.submitProject.mockResolvedValue(mockProject);

      const result = await controller.submitProject(mockDto, mockUser);

      expect(service.submitProject).toHaveBeenCalledWith(
        mockDto.githubUrl,
        mockUser.userId
      );
      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual(mockProject);
    });
  });
});
```

### 集成测试 (可选)

- [ ] 测试完整的提交流程（从 HTTP 请求到数据库记录）
- [ ] 测试速率限制生效
- [ ] 测试认证失败场景

---

## Common Pitfalls to Avoid

### ❌ 错误做法

1. **忘记检查项目重复**
   - 直接创建记录而不检查 `githubUrl` 是否已存在
   - ✅ 使用 `prisma.project.findUnique({ where: { githubUrl } })` 先检查

2. **返回敏感信息**
   - 响应包含 `submittedBy`, `reviewedBy` 等内部字段
   - ✅ 使用解构过滤敏感字段

3. **速率限制配置不当**
   - 限制过于宽松，容易被滥用
   - ✅ 设置合理的限制：3次/分钟

4. **错误处理不完善**
   - Agent SDK 失败时未处理异常
   - ✅ 让异常向上传播，由 NestJS 异常过滤器处理

5. **日期格式转换错误**
   - 直接存储 ISO 字符串到 DateTime 字段
   - ✅ 使用 `new Date(projectInfo.updatedAt)` 转换

### ✅ 正确做法

1. 先检查唯一约束，避免重复记录
2. 过滤响应中的敏感字段
3. 设置合理的速率限制
4. 正确处理日期类型转换
5. 使用 Prisma 事务（如果需要多步操作）

---

## Dependencies

### Story 依赖
- ✅ **Story 8.1**: Project 模型已创建
- ✅ **Story 8.2**: GithubFetcherService 已实现

### 后续依赖
- ⏳ **Story 8.4**: 项目展示页面 (需要本 Story 的数据)
- ⏳ **Story 8.6**: 管理员审核界面 (需要本 Story 的 PENDING 项目)
- ⏳ **Story 8.7**: 我的项目管理 (需要本 Story 的 API)

### 外部依赖
- `@nestjs/throttler` - 速率限制
- `@prisma/client` - 数据库操作
- `class-validator` - DTO 验证

---

## 参考资料

### Epic 文档引用
- Story 8.3 完整定义: [Source: docs/planning-artifacts/epics.md#Story 8.3]
- Epic 8 总览: [Source: docs/planning-artifacts/epics.md#Epic 8]

### 前序 Story 文档
- Story 8.1 Project 模型: [Source: docs/implementation-artifacts/8-1-project-database-model.md]
- Story 8.2 Agent SDK 集成: [Source: docs/implementation-artifacts/8-2-agent-sdk-integration.md]

### 项目上下文
- 项目结构和规范: [Source: docs/project-context.md]
- 后端架构: [Source: docs/planning-artifacts/architecture.md]

### 代码参考
- JwtAuthGuard: [Source: apps/api/src/modules/auth/guards/jwt-auth.guard.ts]
- CurrentUser 装饰器: [Source: apps/api/src/common/decorators/current-user.decorator.ts]
- AuthController 速率限制示例: [Source: apps/api/src/modules/auth/auth.controller.ts]

---

## Dev Agent Record

### Implementation Plan

1. **创建 DTO**: 创建 `submit-project.dto.ts` 用于验证 GitHub URL
2. **创建 Service**: 创建 `showcase.service.ts` 实现业务逻辑
   - 检查项目重复
   - 调用 GithubFetcherService
   - 创建数据库记录
3. **创建 Controller**: 创建 `showcase.controller.ts` 暴露 API 端点
   - 添加 JWT 认证守卫
   - 添加速率限制
   - 实现统一响应格式
4. **更新 Module**: 更新 `showcase.module.ts` 注册新的 provider 和 controller
5. **编写测试**: 创建单元测试验证核心逻辑

### Technical Notes

- **认证**: 使用 `JwtAuthGuard` 保护路由，通过 `@CurrentUser()` 获取用户 ID
- **速率限制**: 使用 `@Throttle()` 装饰器，3次/分钟
- **异常处理**: ConflictException (409) 用于重复提交
- **响应格式**: 使用 `ApiResponse<T>` 统一响应结构
- **日期处理**: ISO 8601 字符串需转换为 `Date` 对象
- **GitHubFetcherService**: 已在 Story 8.2 实现，直接注入使用

### Files to Create

| 文件路径 | 描述 |
|---------|------|
| `apps/api/src/modules/showcase/showcase.controller.ts` | 项目提交 API 控制器 |
| `apps/api/src/modules/showcase/showcase.service.ts` | 项目提交业务逻辑服务 |
| `apps/api/src/modules/showcase/dto/submit-project.dto.ts` | 提交请求 DTO |
| `apps/api/src/modules/showcase/showcase.service.spec.ts` | Service 单元测试 |
| `apps/api/src/modules/showcase/showcase.controller.spec.ts` | Controller 单元测试 |

### Files to Modify

| 文件路径 | 描述 |
|---------|------|
| `apps/api/src/modules/showcase/showcase.module.ts` | 添加 Controller, Service, PrismaModule |
| `apps/api/src/app.module.ts` | 确保 ShowcaseModule 已注册 |

---

**状态变更**: backlog → ready-for-dev → done

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required during story implementation.

### Completion Notes List

**Story 8.3 实现完成 - 项目提交 API**

**已创建内容:**
1. ✅ `submit-project.dto.ts` - GitHub URL 验证 DTO
2. ✅ `showcase.service.ts` - 项目提交业务逻辑服务
3. ✅ `showcase.controller.ts` - 项目提交 API 控制器
4. ✅ `showcase.service.spec.ts` - Service 单元测试 (11 测试)
5. ✅ `showcase.controller.spec.ts` - Controller 单元测试 (4 测试)

**已修改内容:**
1. ✅ `showcase.module.ts` - 注册 Controller, Service, ThrottlerModule
2. ✅ `app.module.ts` - 注册 ShowcaseModule
3. ✅ `src/__mocks__/prisma-client.ts` - 添加 Project 和 ProjectStatus 类型

**关键实现要点:**
- 使用 `JwtAuthGuard` 保护路由，`@CurrentUser()` 获取用户 ID
- 速率限制: 3次/分钟，使用 `@Throttle()` 装饰器
- 重复检查: `prisma.project.findUnique({ where: { githubUrl } })`
- 调用 `GithubFetcherService.fetchProjectInfo()` 抓取 GitHub 信息
- 使用 `ConflictException` (409) 处理重复提交
- 响应过滤: 移除 `submittedBy`, `reviewedBy` 等敏感字段
- 日期转换: ISO 字符串 → `Date` 对象

**测试验证:**
- 所有 showcase 模块测试通过 (46 测试, 3 套件)
- 单元测试覆盖 Service 和 Controller
- 测试重复提交场景
- 测试 GitHub fetcher 错误传播

---

## Senior Developer Review (AI)

**Review Date:** 2026-01-17
**Reviewer:** Code Review Workflow

### Issues Found and Fixed

#### HIGH Issues Fixed
1. ✅ **PrismaModule 未在 ShowcaseModule 中导入** - 已添加到 imports
2. ✅ **导入路径不一致** - 统一 Controller 中的导入路径
3. ✅ **File List 不完整** - 已添加缺失的 E2E 测试和工厂文件

#### MEDIUM Issues Fixed
1. ✅ **类型安全问题** - 使用 `this.prismaProject` 替代多处 `(this.prisma as any)`
2. ✅ **E2E 测试未在 AC 中标记** - 已更新 File List 文档

### Review Notes
- 所有单元测试通过 (46 测试, 3 套件)
- 代码质量良好，遵循 NestJS 最佳实践
- 建议在部署前运行 `prisma generate` 确保类型正确生成

### Next Steps
- [ ] 提交代码变更到 Git
- [ ] 等待 CI/CD 验证
- [ ] 标记 Story 为 done

---

### Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story 8.3 创建完成 - 项目提交 API |
| 2026-01-17 | Story 8.3 实现完成 - 项目提交 API (done) |
| 2026-01-17 | 代码审查 - 发现并修复 HIGH/MEDIUM 问题 (in-progress) |

---

## File List

### Files Created
- `docs/implementation-artifacts/8-3-project-submission-api.md`
- `apps/api/src/modules/showcase/dto/submit-project.dto.ts`
- `apps/api/src/modules/showcase/showcase.service.ts`
- `apps/api/src/modules/showcase/showcase.controller.ts`
- `apps/api/src/modules/showcase/showcase.service.spec.ts`
- `apps/api/src/modules/showcase/showcase.controller.spec.ts`
- `tests/e2e/project-submission.spec.ts` - E2E 测试
- `tests/e2e/showcase-api.spec.ts` - API 集成测试
- `tests/support/fixtures/factories/project.factory.ts` - 项目数据工厂

### Files Modified
- `apps/api/src/modules/showcase/showcase.module.ts` - 添加 Controller, Service, PrismaModule, ThrottlerModule
- `apps/api/src/app.module.ts` - 注册 ShowcaseModule
- `apps/api/src/__mocks__/prisma-client.ts` - 添加 Project 相关类型
- `package.json` - 依赖更新
- `tests/README.md` - 测试文档更新
- `tests/support/fixtures/index.ts` - 测试 fixtures 导出更新
