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

---

## Epic 8: BMAD 项目展示平台

### 目标
创建一个展示用 BMAD 开发的 GitHub 项目的平台，用户可以提交项目链接，系统通过 Agent SDK 自动分析并抓取项目信息，管理员审核后发布展示。

### Stories

#### Story 8.1: 项目数据库模型

**用户故事:**
作为系统开发者，
我需要创建项目展示的数据库模型，
以便存储 GitHub 项目信息和审核状态。

**任务:**
- [ ] Prisma Schema 添加 Project 模型
- [ ] 定义字段：repositoryName, description, owner, stars, language, topics, updatedAt, homepageUrl, license, category, suggestedTags, screenshotUrl, githubUrl, status, submittedBy, reviewedBy, reviewedAt
- [ ] 创建 ProjectStatus 枚举 (PENDING, APPROVED, REJECTED)
- [ ] 创建 ProjectCategory 枚举 (WEB_APP, CLI, LIBRARY, API, MOBILE, OTHER)
- [ ] 添加关联：submittedBy → User, reviewedBy → User
- [ ] 运行 Prisma 迁移

**验收标准:**
- [ ] Prisma migrate 成功执行
- [ ] 数据库表创建成功
- [ ] 索引正确配置（status, category, submittedBy）

---

#### Story 8.2: Agent SDK 集成服务

**用户故事:**
作为系统开发者，
我需要创建 GitHub 项目信息抓取服务，
以便用户提交链接后自动获取项目详情。

**任务:**
- [ ] 安装 `@anthropic-ai/claude-agent-sdk` 依赖
- [ ] 创建 `github-fetcher.service.ts`
- [ ] 实现抓取逻辑：
  - 解析 GitHub URL 提取 owner/repo
  - 调用 Agent SDK query() 方法
  - 使用提示词让 Claude 访问仓库并分析 README
  - 提取指定字段并返回 JSON 格式数据
- [ ] 添加超时和错误处理
- [ ] 添加响应数据验证（Zod schema）

**提示词设计:**
```
请访问这个 GitHub 仓库并分析提取项目信息：{repoUrl}

你需要：
1. 访问该 GitHub 仓库页面
2. 查看 README.md 文件
3. 提取以下信息并以 JSON 格式返回：

{
  "repositoryName": "仓库名",
  "description": "项目描述（从 README 提取，1-2 句话）",
  "owner": "所有者用户名",
  "stars": 星标数,
  "language": "主要编程语言",
  "topics": ["标签1", "标签2"],
  "updatedAt": "最后更新时间 (ISO 8601)",
  "homepageUrl": "官网 URL（如果有）",
  "license": "开源协议",
  "category": "建议分类 (WEB_APP | CLI | LIBRARY | API | MOBILE | OTHER)",
  "suggestedTags": ["建议的展示标签"]
}

只返回 JSON，不要其他内容。
```

**验收标准:**
- [ ] Agent SDK 能正确调用 Claude
- [ ] 能成功解析 GitHub URL
- [ ] 能提取并返回正确的项目信息
- [ ] 错误情况有适当处理

---

#### Story 8.3: 项目提交 API

**用户故事:**
作为注册用户，
我希望提交我的 BMAD 项目 GitHub 链接，
以便系统抓取信息并提交审核。

**任务:**
- [ ] 创建 `showcase.controller.ts` 和 `showcase.service.ts`
- [ ] 创建 `submit-project.dto.ts`（githubUrl 验证）
- [ ] 实现 POST /api/v1/showcase/submit
- [ ] 验证用户已登录
- [ ] 验证 GitHub URL 格式
- [ ] 调用 GitHubFetcherService 获取项目信息
- [ ] 保存到数据库，状态为 PENDING
- [ ] 返回抓取的项目预览信息
- [ ] 添加速率限制（防止滥用）

**验收标准:**
- [ ] 只有登录用户可以提交
- [ ] GitHub URL 格式验证正确
- [ ] 项目信息自动抓取并保存
- [ ] 返回预览数据供用户确认
- [ ] 相同项目重复提交返回友好提示

---

#### Story 8.4: 项目展示页面

**用户故事:**
作为访客/用户，
我希望浏览所有已审核通过的 BMAD 项目，
以便发现和学习其他人的作品。

**任务:**
- [ ] 实现 GET /api/v1/showcase/projects API
  - 分页支持
  - 筛选：按 category、language
  - 搜索：按 repositoryName、description
  - 排序：latest、stars、recentlyAdded
- [ ] 创建项目展示页面 `/showcase`
- [ ] 创建项目卡片组件（ProjectCard）
  - 显示：项目名、描述、语言标签、Stars 数
  - 可选：截图、分类标签
- [ ] 创建筛选/搜索栏组件
- [ ] 实现响应式网格布局

**验收标准:**
- [ ] 页面展示所有 APPROVED 状态的项目
- [ ] 搜索和筛选功能正常工作
- [ ] 分页加载流畅
- [ ] 卡片点击可跳转到项目详情页

---

#### Story 8.5: 项目详情页

**用户故事:**
作为访客/用户，
我希望查看项目的完整信息，
以便更深入了解该项目。

**任务:**
- [ ] 实现 GET /api/v1/showcase/projects/:id API
- [ ] 创建项目详情页面 `/showcase/:id`
- [ ] 展示完整项目信息：
  - 项目名称、描述
  - GitHub 链接（跳转按钮）
  - Stars、Forks、Issues 数量
  - 主要语言、标签、分类
  - 最后更新时间
  - 开源协议
  - 提交者信息
- [ ] 添加"查看更多相关项目"推荐
  - 同分类项目
  - 同语言项目

**验收标准:**
- [ ] 详情页展示所有项目信息
- [ ] GitHub 按钮正确跳转
- [ ] 相关项目推荐正确

---

#### Story 8.6: 管理员审核界面

**用户故事:**
作为管理员，
我希望审核用户提交的项目，
以便控制展示内容的质量。

**任务:**
- [ ] 实现 GET /api/v1/admin/showcase/pending API
  - 返回所有 PENDING 状态项目
  - 分页支持
- [ ] 实现 PUT /api/v1/admin/showcase/:id/approve API
  - 将状态改为 APPROVED
  - 记录 reviewedBy 和 reviewedAt
- [ ] 实现 PUT /api/v1/admin/showcase/:id/reject API
  - 将状态改为 REJECTED
  - 记录拒绝原因
  - 记录 reviewedBy 和 reviewedAt
- [ ] 创建管理员审核页面 `/admin/showcase`
- [ ] 创建待审核徽章显示数量
- [ ] 创建项目预览卡片
- [ ] 创建批准/拒绝按钮和对话框

**验收标准:**
- [ ] 只有管理员可以访问
- [ ] 待审核列表正确显示
- [ ] 批准后项目出现在展示页
- [ ] 拒绝的项目不显示
- [ ] 徽章数量实时更新

---

#### Story 8.7: 我的项目管理

**用户故事:**
作为注册用户，
我希望查看和管理我提交的项目，
以便了解审核状态。

**任务:**
- [ ] 实现 GET /api/v1/showcase/my-projects API
- [ ] 创建"我的项目"页面 `/showcase/my-projects`
- [ ] 显示用户提交的所有项目
- [ ] 显示审核状态（待审核/已通过/已拒绝）
- [ ] 拒绝原因显示（如果被拒绝）
- [ ] 允许删除自己的项目（仅 PENDING/REJECTED）
- [ ] 允许重新提交被拒绝的项目

**验收标准:**
- [ ] 页面显示当前用户的所有提交
- [ ] 状态显示清晰
- [ ] 可以删除待审核项目
- [ ] 被拒绝项目可以重新编辑提交

---

#### Story 8.8: 展示页菜单入口

**用户故事:**
作为任何用户，
我希望在导航栏找到项目展示入口，
以便方便地访问展示页面。

**任务:**
- [ ] 在主导航栏添加"项目展示"菜单项
- [ ] 路由配置 `/showcase`
- [ ] 添加图标（lucide-react 的 GitHub/Code 图标）
- [ ] 移动端响应式适配

**验收标准:**
- [ ] 导航栏显示"项目展示"链接
- [ ] 点击跳转到展示页
- [ ] 移动端菜单正常工作

### 验收标准
- [ ] 注册用户可以提交 GitHub 项目链接
- [ ] 系统自动抓取并保存项目信息
- [ ] 访客可以浏览已审核通过的项目
- [ ] 搜索、筛选、排序功能正常
- [ ] 管理员可以审核待审核项目
- [ ] 用户可以��看自己的提交状态

---

#### Story 8.9: 项目信息手工同步

**用户故事:**
作为登录用户，
我希望在项目详情页手工触发同步最新的 GitHub 信息，
以便项目数据（stars、forks 等）保持最新。

**任务:**
- [ ] Prisma Schema 添加 `lastSyncedAt` 和 `lastSyncStatus` 字段到 Project 模型
- [ ] 创建同步限制缓存机制（Redis 或内存，记录 `lastSyncAttempt:{userId}:{projectId}`）
- [ ] 创建 `POST /api/v1/showcase/projects/:id/sync` API
  - 验证用户已登录
  - 检查距离上次同步是否超过 5 分钟
  - 调用 GitHub API 获取最新数据：
    - Stars（星标数）
    - Forks（派生数）
    - Open Issues 数量
    - Description（描述）
    - Topics（标签）
  - 更新数据库字段
  - 更新 `lastSyncedAt` 时间戳
  - 成功返回更新后的数据，失败返回错误（不计入限制）
- [ ] 在项目详情页添加"同步信息"按钮
  - 仅登录用户可见
  - 显示 loading 状态
  - 同步成功后刷新页面数据
  - 同步失败显示错误提示（toast）
- [ ] 在项目详情页显示"最后同步时间"
  - 格式：相对时间（如 "5分钟前"）或具体时间
  - 未同步过的项目显示"未同步"

**验收标准:**
- [ ] 只有登录用户能看到同步按钮
- [ ] 5分钟内重复同步被阻止并显示提示
- [ ] 同步成功后 stars、forks、issues、description、topics 字段更新
- [ ] 最后同步时间正确显示
- [ ] 同步失败不计入 5 分钟限制
- [ ] API 有适当的速率限制（防止恶意调用）
