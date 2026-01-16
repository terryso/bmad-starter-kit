# Story 1.1: 初始化 Monorepo 结构

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为 开发者,
我想要 初始化 pnpm workspace Monorepo 结构,
以便 为前后端代码共享类型和配置提供统一的基础.

## Acceptance Criteria

**Given** 项目根目录存在
**When** 执行初始化脚本
**Then** 创建 `pnpm-workspace.yaml` 配置文件，包含 `apps/*` 和 `packages/*` 工作区
**And** 创建 `apps/` 和 `packages/` 目录
**And** 更新根目录 `package.json`，包含 `dev`、`build`、`lint` 脚本
**And** 安装 `concurrently` 和 `turbo` 作为开发依赖
**And** 执行 `pnpm install` 成功无报错

## Tasks / Subtasks

- [x] 1. 创建 pnpm workspace 配置文件 (AC: #1, #2)
  - [x] 1.1 在根目录创建 `pnpm-workspace.yaml`
  - [x] 1.2 配置 `packages: ['apps/*', 'packages/*']`
  - [x] 1.3 创建 `apps/` 目录
  - [x] 1.4 创建 `packages/` 目录

- [x] 2. 更新根目录 package.json (AC: #3, #4)
  - [x] 2.1 更新 `name` 为 `cuplayer-monorepo`
  - [x] 2.2 添加根脚本: `dev`, `build`, `lint`
  - [x] 2.3 添加开发依赖: `concurrently`, `turbo`

- [x] 3. 验证安装 (AC: #5)
  - [x] 3.1 执行 `pnpm install` 无报错
  - [x] 3.2 验证 node_modules 正确链接

## Dev Notes

### Epic Context

**Epic 1 目标**: 搭建开发环境，创建 Monorepo 结构，为后续开发奠定基础

这是 Epic 1 的第一个 Story，完成后将为整个项目建立 Monorepo 基础架构。后续 Story 将在此基础上迁移前端代码、创建后端骨架和共享类型包。

**Epic 1 Story 顺序:**
1. 1-1-init-monorepo (当前) - 初始化 Monorepo 结构
2. 1-2-migrate-frontend - 迁移前端代码到 apps/web
3. 1-3-nestjs-skeleton - 创建 NestJS 后端骨架
4. 1-4-shared-types - 创建共享类型包
5. 1-5-prisma-setup - 配置 Prisma 和数据库连接

### Architecture Compliance

**Monorepo 结构决策** (来源: `docs/planning-artifacts/architecture.md`)

项目采用 pnpm workspace Monorepo 架构，原因:
- TypeScript 类型在前后端之间共享
- API 变更时前后端同步更新
- 统一开发配置和构建流程

**目标结构:**
```
cuplayer/
├── apps/
│   ├── web/                 # 前端 (React + Vite)
│   └── api/                 # 后端 (NestJS)
├── packages/
│   └── shared/              # 共享类型
├── pnpm-workspace.yaml       # 工作区配置
├── package.json              # 根 package.json
└── turbo.json                # Turborepo 配置 (可选)
```

### Technical Requirements

**pnpm workspace.yaml 配置:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**根 package.json 结构:**
```json
{
  "name": "cuplayer-monorepo",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter web dev\" \"pnpm --filter api start:watch\"",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "turbo": "^1.11.0"
  }
}
```

**依赖版本:**
- `concurrently`: ^8.2.2 (并行运行多个命令)
- `turbo`: ^1.11.0 (Turborepo 构建加速)

### File Structure Requirements

**本 Story 创建的文件:**

| 文件路径 | 用途 |
|---------|------|
| `pnpm-workspace.yaml` | pnpm workspace 配置 |
| `apps/` | 前后端应用目录 (空目录，本 Story 只创建) |
| `packages/` | 共享包目录 (空目录，本 Story 只创建) |
| `package.json` (更新) | 根 package.json，添加 Monorepo 脚本 |

**注意事项:**
- `apps/` 和 `packages/` 目录本 Story 只创建空目录
- 前端代码迁移在 Story 1.2
- 后端骨架创建在 Story 1.3

### Project Structure Notes

**当前状态 (Story 开始前):**
- 项目是标准的 Vite + React 单体应用
- 源码在 `src/` 目录
- package.json 在根目录

**目标状态 (Story 完成后):**
- 项目转为 Monorepo 结构
- 保留原有 src/ 目录 (Story 1.2 迁移到 apps/web)
- 根 package.json 更新为 Monorepo 配置

**检测到的冲突:**
- 原根 package.json 需要保留其原有脚本 (dev, build, lint, preview)
- 新增 Monorepo 管理脚本，不删除原有脚本

### Testing Requirements

**验证步骤:**
1. 执行 `pnpm install` - 应成功无报错
2. 检查 `node_modules/.pnpm/` 目录 - 应有 workspace 链接
3. 执行 `pnpm list` - 应显示 Monorepo 结构

### Implementation Notes

**关键步骤:**

1. **创建 pnpm-workspace.yaml**
   - 位置: 项目根目录
   - 内容: 定义 apps/* 和 packages/* 工作区

2. **创建目录结构**
   ```bash
   mkdir -p apps packages
   ```

3. **更新 package.json**
   - 保留现有 dependencies 和 devDependencies
   - 添加新的 scripts (dev 并行启动前后端)
   - 添加 turbo 和 concurrently

4. **安装依赖**
   ```bash
   pnpm install
   ```

**重要提醒:**
- 本 Story 不迁移任何代码
- 前端代码在 Story 1.2 迁移到 apps/web
- 确保所有路径使用正斜杠 `/` (跨平台兼容)

### Git Intelligence

**最近 5 次提交:**
```
f47b567 完善项目规划文档与 gitignore 配置
7b35424 将快捷操作的生成二维码改为创建分类
33c7ce2 调整相册网格为响应式
bdaad79 Changes
782949f 增强界面多语言与交互
```

**代码模式:**
- 项目使用中文提交信息
- 注重功能完善和 UI 优化

**本 Story 影响:**
- 新增文件不涉及源代码变更
- 不影响现有开发流程

### References

**架构文档引用:**
- Monorepo 结构决策: [Source: docs/planning-artifacts/architecture.md#Repository Structure Decision]
- pnpm workspace 配置: [Source: docs/planning-artifacts/architecture.md#Workspace Configuration]

**项目上下文引用:**
- Monorepo 目标结构: [Source: docs/project-context.md#Monorepo Structure (Target)]
- 命名约定: [Source: docs/project-context.md#Component Naming Patterns]

**Epic 文档引用:**
- Story 1.1 完整定义: [Source: docs/planning-artifacts/epics.md#Story 1.1]
- Epic 1 总览: [Source: docs/planning-artifacts/epics.md#Epic 1]

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

无 (初始 Story，无前置问题)

### Completion Notes List

**实现完成时间:** 2025-12-30

**完成内容:**
1. 创建 `pnpm-workspace.yaml` 配置文件，定义 apps/* 和 packages/* 工作区
2. 创建 `apps/` 和 `packages/` 空目录
3. 更新根 `package.json`:
   - name 改为 `cuplayer-monorepo`
   - 添加 Monorepo 管理脚本: dev, build, lint
   - 保留原有脚本为 `dev:legacy` 和 `build:dev`
   - 添加开发依赖: concurrently ^8.2.2, turbo ^1.11.0
4. 执行 `pnpm install` 成功，安装了 363 个包
5. 验证 workspace 结构正确

**注意事项:**
- 本 Story 不迁移任何源代码，只创建 Monorepo 基础结构
- 前端代码将在 Story 1.2 迁移到 apps/web
- 原有开发流程仍然可用，使用 `npm run dev:legacy` 启动

### Senior Developer Review (AI)

**Review Date:** 2025-12-30
**Reviewer:** claude-opus-4-5-20251101
**Review Outcome:** ✅ **Approve with Fixes Applied**

**Action Items:**
- [x] [HIGH] 添加 pnpm-lock.yaml 到 File List - 已修复
- [x] [MEDIUM] 添加 sprint-status.yaml 到 File List - 已修复
- [x] [MEDIUM] 添加 story 文件本身到 File List - 已修复
- [x] [MEDIUM] 创建 turbo.json 配置文件 - 已修复
- [x] [LOW] 更新 Status 字段为 review - 已修复

**Summary:**
初始 Story 实现正确，所有验收标准均已满足。审查发现的问题（File List 不完整、缺少 turbo.json）已在审查期间自动修复。

**Files Verified:**
- pnpm-workspace.yaml ✅
- turbo.json ✅ (创建于审查期间)
- apps/, packages/ ✅
- package.json ✅
- .gitignore (.turbo/ 已存在) ✅

### File List

**本 Story 创建/修改的文件:**

| 文件 | 操作 | 说明 |
|------|------|------|
| `pnpm-workspace.yaml` | 创建 | pnpm workspace 配置 |
| `turbo.json` | 创建 | Turborepo 配置 |
| `apps/` | 创建 | 应用目录 (空) |
| `packages/` | 创建 | 共享包目录 (空) |
| `package.json` | 修改 | 添加 Monorepo 脚本和依赖 |
| `pnpm-lock.yaml` | 创建 | pnpm lockfile (v9.0) |
| `docs/implementation-artifacts/1-1-init-monorepo.md` | 创建 | Story 文件 |
| `docs/implementation-artifacts/sprint-status.yaml` | 修改 | 更新 story 状态为 review |

### Change Log

**2025-12-30**
- 初始化 Monorepo 基础结构
- 创建 pnpm-workspace.yaml 配置文件
- 更新根 package.json 为 Monorepo 配置
- 添加 concurrently 和 turbo 开发依赖
- 执行 pnpm install 验证成功

**2025-12-30 (Code Review 修复)**
- 创建 turbo.json 配置文件
- 更新 File List 补充缺失的文件记录
- 验证 .gitignore 已包含 .turbo/ 条目
- 更新 Status 字段为 review

---

## Status

done
