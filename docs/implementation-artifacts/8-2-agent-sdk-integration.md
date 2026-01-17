# Story 8.2: Agent SDK 集成服务

**Epic:** Epic 8 - BMAD 项目展示平台
**Story ID:** 8.2
**Status:** done
**Created:** 2025-01-17
**Dependencies:** Story 8.1 (已完成)

---

## 用户故事

**作为** 系统开发者，
**我需要** 创建 GitHub 项目信息抓取服务，
**以便** 用户提交链接后系统可以自动获取并分析项目详情。

---

## 业务背景

BMAD 项目展示平台需要用户提交 GitHub 项目链接。为了提供良好的用户体验，系统应该：

1. 自动解析 GitHub URL 并提取 owner/repo
2. 使用 Claude Agent SDK 访问仓库并分析 README
3. 提取结构化的项目信息（描述、语言、标签等）
4. 保存到数据库供管理员审核

这避免了用户手动填写大量表单字段，提高了提交效率。

---

## 验收标准 (Acceptance Criteria)

### Gherkin 格式

```gherkin
Feature: GitHub 项目信息自动抓取

  Scenario: 成功抓取公开仓库信息
    Given 用户提交了一个有效的 GitHub URL
    When 系统调用 GitHubFetcherService
    And Agent SDK 成功访问仓库
    Then 系统应返回包含以下字段的 JSON:
      | repositoryName | 项目仓库名称 |
      | description | 从 README 提取的描述 |
      | owner | 仓库所有者用户名 |
      | stars | 星标数量 |
      | language | 主要编程语言 |
      | topics | GitHub 主题标签数组 |
      | updatedAt | 最后更新时间 (ISO 8601) |
      | homepageUrl | 官网 URL (可选) |
      | license | 开源协议 |
      | category | 建议分类 (枚举值) |
      | suggestedTags | 建议的展示标签 |

  Scenario: URL 格式验证
    Given 用户提交了 URL
    When URL 不是有效的 GitHub 仓库链接
    Then 系统应抛出 InvalidGitHubUrlException
    And 返回友好的错误消息

  Scenario: Agent SDK 调用超时
    Given 系统调用 Agent SDK
    And 调用时间超过 30 秒
    Then 系统应抛出 AgentTimeoutException
    And 记录错误日志

  Scenario: 响应数据验证
    Given Agent SDK 返回了响应
    When 响应不符合预期的 Zod schema
    Then 系统应抛 new InvalidResponseException
    And 返回原始响应用于调试
```

### 技术验收标准

- [x] `@anthropic-ai/claude-agent-sdk` 依赖已安装 (版本 0.1.69)
- [x] `github-fetcher.service.ts` 创建在 `apps/api/src/modules/showcase/` 目录
- [x] GitHub URL 正则表达式能正确匹配多种格式
- [x] Agent SDK 的 `query()` 函数能正确调用 Claude
- [x] 提示词（prompt）能生成符合预期的 JSON 格式输出
- [x] Zod schema 验证所有必需字段
- [x] 超时设置为 30 秒
- [x] 错误日志记录完整
- [x] 支持自定义 `ANTHROPIC_BASE_URL` 环境变量

---

## 开发者上下文

### 项目技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | NestJS |
| ORM | Prisma |
| 数据库 | PostgreSQL (Supabase) |
| AI SDK | @anthropic-ai/claude-agent-sdk |
| 验证 | Zod + class-validator |
| 语言 | TypeScript (宽松模式) |

### NestJS 模块结构

```
apps/api/src/modules/
├── auth/                    # 认证模块
├── users/                   # 用户模块
├── admin/                   # 管理员模块
└── showcase/                # 项目展示模块 (新增)
    ├── showcase.module.ts
    ├── showcase.controller.ts
    ├── showcase.service.ts
    ├── github-fetcher.service.ts    # ← 本 story 创建
    ├── dto/
    │   ├── submit-project.dto.ts
    │   └── github-fetch.dto.ts
    └── schemas/
        └── project-response.schema.ts  # Zod 验证
```

### Prisma Project 模型 (Story 8.1 已创建)

```prisma
enum ProjectStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ProjectCategory {
  WEB_APP
  CLI
  LIBRARY
  API
  MOBILE
  OTHER
}

model Project {
  id             Int       @id @default(autoincrement())
  repositoryName String
  description    String
  owner          String
  stars          Int
  language       String?
  topics         String[]
  updatedAt      DateTime
  homepageUrl    String?
  license        String?
  category       ProjectCategory
  suggestedTags  String[]
  screenshotUrl  String?
  githubUrl      String   @unique
  status         ProjectStatus @default(PENDING)
  submittedById  Int
  submittedBy    User      @relation(fields: [submittedById], references: [id])
  reviewedById   Int?
  reviewedBy     User?     @relation(fields: [reviewedById], references: [id])
  reviewedAt     DateTime?
  rejectionReason String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([status])
  @@index([category])
  @@index([submittedById])
}
```

---

## 技术实现要求

### 1. 安装 Agent SDK

```bash
# 在 apps/api 目录下安装
cd apps/api
pnpm add @anthropic-ai/claude-agent-sdk@0.1.69
```

### 2. 创建 GitHub URL 解析

支持的 URL 格式：
- `https://github.com/owner/repo`
- `https://github.com/owner/repo.git`
- `github.com/owner/repo`
- `https://www.github.com/owner/repo`

使用正则表达式提取 owner 和 repo：
```typescript
const GITHUB_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/;
```

### 3. Agent SDK 使用方式

使用 `query` 函数调用 Claude Agent SDK：

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

// 在服务方法中
const response = query({
  prompt: systemPrompt + userPrompt,
  options: {
    maxTurns: 1,           // 只需要一次响应
    tools: [],             // 禁用所有内置工具
    persistSession: false, // 不持久化 session
    env: {
      ANTHROPIC_API_KEY: authToken,
      // 可选：自定义 API 地址
      // ANTHROPIC_BASE_URL: customBaseUrl,
    },
  },
});

// 遍历异步生成器获取结果
for await (const message of response) {
  if (message.type === 'result' && message.subtype === 'success') {
    const resultText = (message as any).result as string;
    break;
  }
}
```

### 4. Zod Schema 验证

```typescript
import { z } from 'zod';

export const GitHubProjectResponseSchema = z.object({
  repositoryName: z.string().min(1),
  description: z.string().min(1),
  owner: z.string().min(1),
  stars: z.number().int().min(0),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  updatedAt: z.string(), // ISO 8601 日期字符串
  homepageUrl: z.string().url().nullable(),
  license: z.string().nullable(),
  category: z.enum(['WEB_APP', 'CLI', 'LIBRARY', 'API', 'MOBILE', 'OTHER']),
  suggestedTags: z.array(z.string()).default([]),
});

export type GitHubProjectResponse = z.infer<typeof GitHubProjectResponseSchema>;
```

### 5. Service 类结构

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { GitHubProjectResponseSchema } from './schemas/project-response.schema';

@Injectable()
export class GithubFetcherService {
  private readonly logger = new Logger(GithubFetcherService.name);

  constructor(private configService: ConfigService) {}

  async fetchProjectInfo(githubUrl: string): Promise<GitHubProjectResponse> {
    // 1. 验证 auth token
    const authToken = this.configService.get<string>('ANTHROPIC_AUTH_TOKEN');
    if (!authToken) {
      throw new InternalServerErrorException(
        'ANTHROPIC_AUTH_TOKEN is not configured'
      );
    }

    // 2. 解析 URL
    const { owner, repo } = this.parseGitHubUrl(githubUrl);

    // 3. 调用 Agent SDK
    const response = query({
      prompt: this.buildPrompt(githubUrl),
      options: {
        maxTurns: 1,
        tools: [],
        persistSession: false,
        env: {
          ANTHROPIC_API_KEY: authToken,
        },
      },
    });

    // 4. 收集结果
    let resultText: string | null = null;
    for await (const message of response) {
      if (message.type === 'result' && message.subtype === 'success') {
        resultText = (message as any).result as string;
        break;
      }
    }

    // 5. 解析并验证结果
    const jsonData = this.parseJsonResponse(resultText);
    return GitHubProjectResponseSchema.parse(jsonData);
  }
}
```

### 6. 自定义异常类

创建 `apps/api/src/modules/showcase/exceptions/` 目录：

```typescript
// github-url.exception.ts
import { BadRequestException } from '@nestjs/common';

export class InvalidGitHubUrlException extends BadRequestException {
  constructor(url: string) {
    super(`Invalid GitHub URL: ${url}. Expected format: https://github.com/owner/repo`);
  }
}

// agent-timeout.exception.ts
import { RequestTimeoutException } from '@nestjs/common';

export class AgentTimeoutException extends RequestTimeoutException {
  constructor(owner: string, repo: string) {
    super(`Agent SDK timeout while fetching ${owner}/${repo}. Please try again.`);
  }
}

// invalid-response.exception.ts
import { BadRequestException } from '@nestjs/common';

export class InvalidResponseException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid response from Agent SDK: ${message}`);
  }
}
```

### 7. 环境变量配置

确保 `.env` 文件包含：
```env
ANTHROPIC_AUTH_TOKEN=your_api_key_here
# ANTHROPIC_BASE_URL=https://custom-api.anthropic.com  # 可选
```

### 8. Module 配置

```typescript
// showcase.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubFetcherService } from './github-fetcher.service';

@Module({
  imports: [ConfigModule],
  providers: [GithubFetcherService],
  exports: [GithubFetcherService],
})
export class ShowcaseModule {}
```

---

## 文件结构

```
apps/api/src/modules/showcase/
├── showcase.module.ts                 # 模块定义
├── showcase.controller.ts             # 控制器 (Story 8.3)
├── showcase.service.ts                # 服务 (Story 8.3)
├── github-fetcher.service.ts          # ✨ 本 story 创建
├── dto/
│   ├── submit-project.dto.ts          # (Story 8.3)
│   └── github-url.dto.ts              # URL 验证 DTO
├── schemas/
│   └── project-response.schema.ts     # ✨ Zod 验证 schema
└── exceptions/
    ├── github-url.exception.ts        # ✨ URL 格式异常
    ├── agent-timeout.exception.ts     # ✨ 超时异常
    └── invalid-response.exception.ts  # ✨ 响应格式异常
```

---

## 测试要求

### 单元测试

创建 `github-fetcher.service.spec.ts`：

```typescript
describe('GithubFetcherService', () => {
  let service: GithubFetcherService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GithubFetcherService],
    }).compile();

    service = module.get<GithubFetcherService>(GithubFetcherService);
  });

  describe('parseGitHubUrl', () => {
    it('should parse standard GitHub URL', () => {
      const result = service.parseGitHubUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitHub URL with .git', () => {
      const result = service.parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should throw InvalidGitHubUrlException for invalid URL', () => {
      expect(() => service.parseGitHubUrl('not-a-github-url'))
        .toThrow(InvalidGitHubUrlException);
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse plain JSON', () => {
      const json = '{"name":"test"}';
      const result = service.parseJsonResponse(json);
      expect(result).toEqual({ name: 'test' });
    });

    it('should extract JSON from markdown code block', () => {
      const json = '```json\n{"name":"test"}\n```';
      const result = service.parseJsonResponse(json);
      expect(result).toEqual({ name: 'test' });
    });
  });
});
```

### 集成测试 (可选)

- [x] 使用 mock 的 Anthropic API 响应测试完整流程
- [x] 测试超时场景
- [x] 测试无效响应场景

---

## API 使用示例

```typescript
// 在 showcase.service.ts 中使用 (Story 8.3)
@Injectable()
export class ShowcaseService {
  constructor(
    private prisma: PrismaService,
    private githubFetcher: GithubFetcherService,
  ) {}

  async submitProject(githubUrl: string, userId: number) {
    // 1. 抓取项目信息
    const projectInfo = await this.githubFetcher.fetchProjectInfo(githubUrl);

    // 2. 检查是否已存在
    const existing = await this.prisma.project.findUnique({
      where: { githubUrl: projectInfo.githubUrl },
    });

    if (existing) {
      throw new ConflictException('Project already submitted');
    }

    // 3. 创建项目记录
    const project = await this.prisma.project.create({
      data: {
        ...projectInfo,
        submittedById: userId,
        status: ProjectStatus.PENDING,
      },
    });

    return project;
  }
}
```

---

## 注意事项

### 安全性

1. **API Key 管理**: 使用 `ConfigService` 从环境变量读取，不要硬编码
2. **速率限制**: Story 8.3 中添加，防止滥用
3. **URL 验证**: 只接受 GitHub URL，防止 SSRF

### 性能

1. **超时设置**: 30 秒超时，避免长时间阻塞
2. **异步处理**: 考虑使用消息队列（未来优化）
3. **缓存**: 相同仓库短期内重复提交可缓存结果（未来优化）

### 错误处理

1. **友好消息**: 向用户返回清晰的错误提示
2. **日志记录**: 记录完整错误信息用于调试
3. **降级处理**: 如果 Agent SDK 失败，可考虑让用户手动填写（未来功能）

---

## 依赖检查

- [x] Story 8.1: Project 模型已创建
- [x] Prisma migration 已执行
- [ ] Story 8.3: 项目提交 API (下一步)
- [ ] Story 8.4: 项目展示页面

---

## 参考资料

### Agent SDK 文档

- **NPM Package**: https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk
- **Version**: 0.1.72 (最新)
- **Repository**: https://github.com/anthropics/claude-agent-sdk

### Claude API

- **Documentation**: https://docs.anthropic.com/
- **Model**: claude-opus-4-5-20251101 (推荐用于复杂分析)

### GitHub API (可选替代方案)

如果 Agent SDK 不适用，可考虑使用 GitHub REST API：
- `GET /repos/{owner}/{repo}` - 仓库基本信息
- `GET /repos/{owner}/{repo}/readme` - README 内容

---

**状态变更**: backlog → ready-for-dev → review

---

## Dev Agent Record

### Implementation Plan

1. **安装依赖**: 安装 `@anthropic-ai/claude-agent-sdk@0.1.69` (Claude Agent SDK)
2. **创建模块结构**: 创建 showcase 模块目录及其子目录 (dto, schemas, exceptions)
3. **实现 Zod Schema**: 创建 `GitHubProjectResponseSchema` 用于验证 API 响应
4. **创建异常类**: 创建三个自定义异常类 (`InvalidGitHubUrlException`, `AgentTimeoutException`, `InvalidResponseException`)
5. **实现核心服务**: 创建 `GithubFetcherService` 使用 Agent SDK `query()` 函数调用 Claude
6. **编写单元测试**: 创建完整的单元测试覆盖所有核心功能
7. **配置模块**: 创建 `ShowcaseModule` 导出服务供其他模块使用

### Technical Notes

- **SDK 选择**: 使用 `@anthropic-ai/claude-agent-sdk` 的 `query()` 函数调用 Claude Agent SDK
- **Agent SDK 调用方式**: 使用 `query({ prompt, options: { maxTurns, tools, persistSession, env } })` 返回异步生成器
- **环境变量**: 使用 `ANTHROPIC_AUTH_TOKEN` 而非 `ANTHROPIC_API_KEY`，支持可选的 `ANTHROPIC_BASE_URL`
- **JSON 解析**: 支持从纯 JSON 或 Markdown 代码块中提取 JSON，提高兼容性
- **URL 解析**: 使用单个正则表达式匹配多种 GitHub URL 格式
- **Auth Token 验证**: 在首次调用时验证 `ANTHROPIC_AUTH_TOKEN` 是否配置

### Files Created

| 文件路径 | 描述 |
|---------|------|
| `apps/api/src/modules/showcase/showcase.module.ts` | Showcase 模块定义 |
| `apps/api/src/modules/showcase/github-fetcher.service.ts` | GitHub 项目信息抓取服务 (使用 Agent SDK query) |
| `apps/api/src/modules/showcase/dto/github-url.dto.ts` | GitHub URL 验证 DTO |
| `apps/api/src/modules/showcase/schemas/project-response.schema.ts` | Zod 验证 Schema |
| `apps/api/src/modules/showcase/exceptions/index.ts` | 异常导出索引 |
| `apps/api/src/modules/showcase/exceptions/github-url.exception.ts` | URL 格式异常 |
| `apps/api/src/modules/showcase/exceptions/agent-timeout.exception.ts` | 超时异常 |
| `apps/api/src/modules/showcase/exceptions/invalid-response.exception.ts` | 响应格式异常 |
| `apps/api/src/modules/showcase/github-fetcher.service.spec.ts` | 单元测试 |
| `apps/api/.env.example` | 添加 ANTHROPIC_AUTH_TOKEN 环境变量说明 |

### Files Modified

| 文件路径 | 描述 |
|---------|------|
| `apps/api/package.json` | 添加 @anthropic-ai/claude-agent-sdk 依赖 |

### Dependencies Added

- `@anthropic-ai/claude-agent-sdk`: Claude Agent SDK (版本 0.1.69，使用 query 函数调用)
- `@nestjs/config`: ConfigService for environment variables
- `zod`: Schema validation

### Completion Notes

- ✅ 所有技术验收标准已完成
- ✅ 使用正确的 `@anthropic-ai/claude-agent-sdk` 和 `query()` 函数
- ✅ 30+ 个单元测试全部通过
- ✅ 服务支持多种 GitHub URL 格式解析
- ✅ 完整的错误处理和日志记录
- ✅ 支持自定义 `ANTHROPIC_BASE_URL` 环境变量
- ✅ 空字符串字段统一转换为 null
- ⚠️ 需要环境变量 `ANTHROPIC_AUTH_TOKEN` 才能在生产环境使用

### Change Log

| Date | Change |
|------|--------|
| 2025-01-17 | 初始实现完成 - 使用 @anthropic-ai/claude-agent-sdk 的 query() 函数 |
| 2025-01-17 | 代码审查: 修正 SDK 使用方式，从错误的 @anthropic-ai/sdk 改为正确的 claude-agent-sdk |
