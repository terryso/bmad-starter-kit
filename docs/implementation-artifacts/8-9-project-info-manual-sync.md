# Story 8.9: 项目信息手工同步

Status: completed

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为 登录用户,
我希望 在项目详情页手工触发同步最新的 GitHub 信息,
以便 项目数据（stars、forks 等）保持最新。

## Acceptance Criteria

1. 只有登录用户能看到同步按钮
2. 5分钟内重复同步被阻止并显示提示
3. 同步成功后 stars、forks、issues、description、topics 字段更新
4. 最后同步时间正确显示
5. 同步失败不计入 5 分钟限制
6. API 有适当的速率限制（防止恶意调用）

## Tasks / Subtasks

- [x] Prisma Schema 添加同步字段 (AC: 4)
  - [x] 添加 `lastSyncedAt DateTime?` 字段
  - [x] 添加 `lastSyncStatus String?` 字段
  - [x] 运行 `prisma migrate dev --name add_project_sync_fields`
- [x] 创建同步限制缓存机制 (AC: 2, 5, 6)
  - [x] 创建内存缓存服务 `sync-cache.service.ts`
  - [x] 实现键格式 `lastSyncAttempt:{userId}:{projectId}`
  - [x] 实现间隔检查（5分钟）
  - [x] 失败不计入限制的逻辑
- [x] 创建同步 API 端点 (AC: 1, 2, 3, 5, 6)
  - [x] 创建 DTO: `sync-project-response.dto.ts`
  - [x] 实现 POST /api/v1/showcase/projects/:id/sync
  - [x] 添加 JWT 认证守卫
  - [x] 实现速率限制装饰器
  - [x] 集成 GitHub API 调用
  - [x] 更新数据库字段
- [x] 前端同步按钮组件 (AC: 1, 3, 4)
  - [x] 创建 SyncProjectButton 组件
  - [x] 添加 loading 状态
  - [x] 实现成功后数据刷新
  - [x] 实现错误提示（toast）
- [x] 最后同步时间显示 (AC: 4)
  - [x] 添加相对时间格式化工具函数
  - [x] 在项目详情页显示"最后同步时间"
  - [x] 未同步项目显示"未同步"

## Dev Notes

### Epic 8 Context

**Epic 目标:** 创建一个展示用 BMAD 开发的 GitHub 项目的平台，用户可以提交项目链接，系统通过 Agent SDK 自动分析并抓取项目信息，管理员审核后发布展示。

**前置依赖:**
- Story 8.1: 项目数据库模型（Project 模型已创建）
- Story 8.2: Agent SDK 集成服务（GitHub API 调用模式已建立）
- Story 8.5: 项目详情页（需要在详情页添加同步功能）

**相关故事:**
- Story 8.3: 项目提交 API（同样的 GitHub API 调用逻辑可复用）
- Story 8.7: 我的项目管理（用户可能需要同步自己的项目）
- Story 8.8: 展示页菜单入口（提供访问入口）

### Architecture Compliance

**后端技术栈:**
- NestJS 10.x with TypeScript 5.1.x
- Prisma 6.19.x ORM
- PostgreSQL 15+
- JWT 认证（@nestjs/jwt）
- @nestjs/throttler 6.x 用于速率限制

**前端技术栈:**
- React 18.x
- React Router DOM 6.30.1
- @tanstack/react-query 5.83.0（服务端状态管理）
- shadcn/ui + lucide-react（UI 组件）
- React Hook Form + Zod（表单验证）

### Technical Requirements

#### 1. 数据库 Schema 更新

```prisma
// 在 apps/api/prisma/schema.prisma 的 Project 模型中添加：
model Project {
  // ... 现有字段 ...

  // 同步相关字段（新增）
  lastSyncedAt    DateTime?  // 最后同步时间
  lastSyncStatus  String?    // 最后同步状态 (SUCCESS, FAILED, RATE_LIMITED)
}
```

**迁移命令:**
```bash
cd apps/api
pnpm exec prisma migrate dev --name add_project_sync_fields
pnpm exec prisma generate
```

#### 2. 后端 API 端点设计

**端点:** `POST /api/v1/showcase/projects/:id/sync`

**认证:** 需要 JWT（@UseGuards(JwtAuthGuard)）

**速率限制:**
- 使用 @Throttle() 装饰器
- 建议限制: 10 次/分钟/用户

**请求:**
```typescript
// 无需请求体，从 JWT 获取 userId
// :id 为项目 ID
```

**响应（成功）:**
```typescript
{
  statusCode: 200,
  message: "项目信息同步成功",
  data: {
    id: string,
    stars: number,
    forks: number,
    openIssues: number,
    description: string,
    topics: string[],
    lastSyncedAt: string, // ISO 8601
    githubUpdatedAt: string
  }
}
```

**响应（速率限制）:**
```typescript
{
  statusCode: 429,
  message: "距离上次同步不到 5 分钟，请稍后再试",
  error: "Too Many Requests"
}
```

**响应（未授权）:**
```typescript
{
  statusCode: 403,
  message: "您没有权限同步此项目",
  error: "Forbidden"
}
```

#### 3. 同步服务实现

**SyncCacheService:** 内存缓存服务
- 位置: `apps/api/src/modules/showcase/services/sync-cache.service.ts`
- 键格式: `lastSyncAttempt:{userId}:{projectId}`
- TTL: 5 分钟
- 失败时不设置缓存（允许立即重试）

**GitHub API 调用:**
- 复用或参考 Story 8.2 的 GitHub 调用模式
- 直接调用 GitHub REST API
- 端点: `https://api.github.com/repos/{owner}/{repo}`
- 获取字段: stargazers_count, forks_count, open_issues_count, description, topics, updated_at

#### 4. 前端组件设计

**SyncProjectButton 组件:**
- 位置: `apps/web/src/components/showcase/SyncProjectButton.tsx`
- Props: `{ projectId: string, onSyncSuccess: () => void }`
- 功能:
  - 仅登录用户可见（通过 useAuth hook 检查）
  - 显示 loading 状态（旋转图标）
  - 同步成功后调用 `onSyncSuccess` 回调
  - 同步失败显示 toast 错误提示

**按钮 UI:**
```typescript
// 使用 shadcn/ui Button + lucide-react RefreshCw 图标
<Button
  variant="outline"
  size="sm"
  onClick={handleSync}
  disabled={isSyncing || isRateLimited}
>
  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
  {isSyncing ? "同步中..." : "同步信息"}
</Button>
```

**最后同步时间显示:**
- 位置: 项目详情页，项目信息区域
- 格式: 相对时间（"5分钟前"、"2小时前"）或具体时间
- 未同步: 显示"未同步"
- 使用 dayjs 或 date-fns 进行格式化

### File Structure Requirements

**后端文件:**
```
apps/api/src/modules/showcase/
├── dto/
│   └── sync-project-response.dto.ts    # 同步响应 DTO
├── services/
│   ├── sync-cache.service.ts           # 同步缓存服务
│   └── showcase.service.ts             # 扩展：添加 syncProject 方法
├── controllers/
│   └── showcase.controller.ts          # 扩展：添加 sync 端点
└── exceptions/
    └── sync.exceptions.ts              # 自定义异常（可选）
```

**前端文件:**
```
apps/web/src/
├── components/
│   └── showcase/
│       └── SyncProjectButton.tsx       # 同步按钮组件
├── pages/
│   └── showcase/
│       └── ProjectDetail.tsx           # 修改：集成同步按钮
├── lib/
│   └── utils/
│       └── date.ts                     # 日期格式化工具
└── hooks/
    └── useProjectSync.ts               # 同步逻辑 hook（可选）
```

### Testing Requirements

**单元测试:**
- SyncCacheService: 测试缓存设置、检查、过期逻辑
- ShowcaseService.syncProject: 测试成功、失败、速率限制场景
- 使用 Jest + @nestjs/testing

**E2E 测试:**
- 位置: `tests/e2e/showcase-sync.spec.ts`
- 测试场景:
  1. 未登录用户无法看到同步按钮
  2. 登录用户可以看到同步按钮
  3. 首次同步成功
  4. 5分钟内重复同步被阻止
  5. 同步失败不计入限制
  6. 最后同步时间正确显示

### Previous Story Intelligence (Story 8.8)

**关键学习点:**
1. **导航激活逻辑**: 使用 `startsWith()` 而非严格相等来处理子路径高亮
2. **路由名称映射**: Header.tsx 中的 `getRouteName()` 函数支持通配符
3. **测试模式**: 23 个 E2E 测试用例覆盖所有场景
4. **图标一致性**: 使用 lucide-react，统一 `w-5 h-5` 尺寸

**可复用模式:**
- 配置数组用于导航项
- 使用 `cn()` 工具处理条件类名
- 响应式设计：lg 断点 (1024px)

### Git Intelligence

**最近提交:**
- `fcbf1bc` chore: ignore playwright test auth state
- `8950c65` fix: resolve admin stats 500 error and improve test reliability
- `d8d13c4` fix: correct bmad-starter-kit stats and update system statistics page
- `718eeb9` feat: add README content fetching for accurate project descriptions

**模式观察:**
- E2E 测试使用 Playwright
- 认证状态存储在 `.auth/user.json`（已加入 .gitignore）
- 测试文档创建在 `docs/implementation-artifacts/` 目录

### Project Structure Notes

**对齐统一项目结构:**
- ✅ 使用 `@/` 别名进行前端导入
- ✅ 使用 PascalCase 命名组件
- ✅ 使用 kebab-case 命名工具文件
- ✅ 测试文件与源文件并置（.spec.ts）
- ✅ E2E 测试放在 `tests/e2e/` 目录

**检测到的冲突/差异:**
- 无特殊冲突需要处理

### API Endpoint Examples

**GitHub API 调用示例:**
```typescript
async function fetchGitHubRepoInfo(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      // 可选：添加 GitHub token 提高速率限制
      // 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    description: data.description,
    topics: data.topics || [],
    updatedAt: data.updated_at
  };
}
```

**SyncCacheService 实现示例:**
```typescript
@Injectable()
export class SyncCacheService {
  private cache = new Map<string, number>();
  private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5分钟

  getLastSyncAttempt(userId: string, projectId: string): number | null {
    const key = `lastSyncAttempt:${userId}:${projectId}`;
    return this.cache.get(key) || null;
  }

  setSyncAttempt(userId: string, projectId: string): void {
    const key = `lastSyncAttempt:${userId}:${projectId}`;
    this.cache.set(key, Date.now());
  }

  canSync(userId: string, projectId: string): boolean {
    const lastAttempt = this.getLastSyncAttempt(userId, projectId);
    if (!lastAttempt) return true;
    return Date.now() - lastAttempt > this.COOLDOWN_MS;
  }

  getRemainingCooldown(userId: string, projectId: string): number {
    const lastAttempt = this.getLastSyncAttempt(userId, projectId);
    if (!lastAttempt) return 0;
    const elapsed = Date.now() - lastAttempt;
    return Math.max(0, this.COOLDOWN_MS - elapsed);
  }
}
```

### References

- [Epic 8 完整定义](../../planning-artifacts/epics.md#epic-8-bmad-项目展示平台)
- [项目上下文规则](../project-context.md)
- [Story 8.5 实现参考](./8-5-project-detail-page.md) - 项目详情页
- [Story 8.2 实现参考](./8-2-agent-sdk-integration.md) - GitHub API 调用

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

### File List

**后端文件:**
- `apps/api/prisma/schema.prisma` - 添加 lastSyncedAt, lastSyncStatus 字段
- `apps/api/prisma/migrations/20260118223648_add_project_sync_fields/migration.sql` - 数据库迁移
- `apps/api/src/modules/showcase/services/sync-cache.service.ts` - 同步缓存服务（新建）
- `apps/api/src/modules/showcase/showcase.service.ts` - 添加 syncProject 方法
- `apps/api/src/modules/showcase/showcase.controller.ts` - 添加 POST /projects/:id/sync 端点
- `apps/api/src/modules/showcase/showcase.module.ts` - 注册 SyncCacheService
- `apps/api/src/modules/showcase/dto/sync-project-response.dto.ts` - 同步响应 DTO（新建）
- `apps/api/src/modules/showcase/showcase.service.spec.ts` - 更新单元测试
- `apps/api/src/test-helpers/fixtures/api-integration.fixture.ts` - 更新测试辅助

**前端文件:**
- `apps/web/src/components/showcase/SyncProjectButton.tsx` - 同步按钮组件（新建）
- `apps/web/src/components/showcase/ProjectDetailHeader.tsx` - 集成同步按钮
- `apps/web/src/components/showcase/ProjectDetailMeta.tsx` - 显示最后同步时间
- `apps/web/src/pages/showcase/ProjectDetail.tsx` - 添加同步成功回调
- `apps/web/src/lib/utils.ts` - 添加 formatRelativeTime 工具函数
- `apps/web/src/lib/api.ts` - 添加 syncProject API 方法

**共享类型:**
- `packages/shared/src/types/showcase.types.ts` - ProjectDetail 添加 lastSyncedAt, lastSyncStatus

**测试文件:**
- `tests/api/showcase-sync.spec.ts` - API 测试（新建）
- `tests/e2e/project-sync.spec.ts` - E2E 测试（新建）
- `tests/support/helpers/selectors.ts` - 更新测试选择器
- `tests/README.md` - 更新测试文档

**文档:**
- `docs/implementation-artifacts/8-9-project-info-manual-sync.md` - 本 story 文件
- `docs/implementation-artifacts/test-automation-summary.md` - 测试自动化总结
- `docs/implementation-artifacts/sprint-status.yaml` - Sprint 状态跟踪
- `docs/planning-artifacts/epics.md` - Epic 状态更新
