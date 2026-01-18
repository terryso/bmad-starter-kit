# BMAD Starter Kit

[English](README.md) | [简体中文](README.zh-CN.md)

> 一个用于练习 BMAD 开发工作流的学习项目

## 这是什么项目？

这是一个 **BMAD 学习练习场** - 不是生产应用。它的目的是帮助你在不花时间做初始设置的情况下，练习完整的 BMAD 开发工作流。

克隆此仓库后，你可以立即开始练习：
- 创建新的史诗和用户故事
- 使用 AI 代理实现功能
- 编写自动化测试
- 进行代码审查

项目已经包含一个基础的认证系统和管理后台，作为添加新功能的起点。

## 在线演示

[https://bmad-starter-kit.surge.sh/](https://bmad-starter-kit.surge.sh/)

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/terryso/bmad-starter-kit.git
cd bmad-starter-kit

# 安装依赖
pnpm install

# 配置环境
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env 填入数据库配置

# 初始化数据库
cd apps/api
npx prisma generate
npx prisma db push
cd ../..

# 启动开发服务
pnpm dev
```

访问 http://localhost:8080 查看前端，http://localhost:3000 访问后端 API。

## 推荐的学习流程

按照以下步骤练习完整的 BMAD 开发周期：

### 第 1 步：创建新史诗

使用 PM 代理定义一个新功能史诗：

```
/pm
我要新增一个 epic，实现 [你的功能想法]
```

**示例史诗想法：**
- 用户资料管理
- 邮件通知系统
- 文件上传功能
- 审计日志
- 双因素认证

### 第 2 步：迭代规划

审查史诗后，运行迭代规划：

```
/sprint-planning
```

这会生成一个 `sprint-status.yaml` 文件，追踪所有史诗和故事。

### 第 3 步：创建第一个故事

创建详细的用户故事：

```
/create-story
```

代理会生成包含验收标准的综合故事文档。

### 第 4 步：审查故事设计

审查 `docs/implementation-artifacts/stories/` 中生成的故事文档。确保：
- 需求清晰
- 技术方案合理
- 验收标准完整

### 第 5 步：实现代码

准备好后，开始开发：

```
/dev-story
```

代理会按照项目约定实现故事。

### 第 6 步：编写自动化测试

实现完成后，添加测试覆盖：

```
/automate
```

这会生成单元测试、集成测试和端到端测试。

### 第 7 步：代码审查

审查实现质量：

```
/code-review
```

代理会进行对抗性审查并找出需要修复的问题。

### 第 8 步：修复问题并完成

让代理修复所有已识别的问题，并将故事状态更新为已完成。

### 第 9 步：重复

回到第 3 步处理下一个故事，直到迭代中的所有故事都完成。

## 项目包含内容

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + shadcn/ui |
| 后端 | NestJS + Prisma |
| 数据库 | PostgreSQL |
| 认证 | JWT（访问令牌 + 刷新令牌）|

### 已有功能

- 用户注册和登录
- JWT 认证（带刷新令牌）
- 基于角色的访问控制（USER/ADMIN）
- 带统计信息的管理后台
- 用户管理（列表、搜索、筛选）
- **BMAD 项目展示** - 提交并展示你的 BMAD 练习项目

### 项目结构

```
bmad-starter-kit/
├── apps/
│   ├── api/              # NestJS 后端
│   │   └── src/modules/  # 功能模块
│   └── web/              # React 前端
│       └── src/          # 组件、页面、hooks
├── packages/
│   └── shared/           # 共享类型和工具
├── docs/
│   ├── planning-artifacts/    # PRD、架构文档
│   └── implementation-artifacts/  # 故事、测试
├── _bmad/                # BMAD 配置
└── docs/project-context.md  # AI 代理上下文规则
```

## 默认管理员用户

通过 UI 注册后，将用户提升为管理员：

```sql
UPDATE "user" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 开发命令

```bash
pnpm dev          # 同时启动前端和后端
pnpm dev:api      # 仅启动后端（端口 3000）
pnpm dev:web      # 仅启动前端（端口 8080）
pnpm build        # 构建所有包
pnpm lint         # 运行代码检查
pnpm test         # 运行所有测试
```

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL（本地或 Supabase）
- Claude Code 授权（推荐）或设置 `ANTHROPIC_API_KEY`

> **注意**: BMAD 工作流需要 Claude Code 订阅或 API key，费用可能较高。你可以考虑使用 [GLM Coding Plan](https://www.bigmodel.cn/claude-code?ic=TVUZHTWCW9) 作为替代方案（首月仅需 ¥100，API 调用次数基本无限）。

## 许可证

[MIT](LICENSE)

## 学习资源

- [BMAD 文档](https://docs.bmad-method.org/)
- [Claude Code CLI](https://claude.com/claude-code)

## 贡献指南

这是一个社区学习项目！如果你在练习 BMAD 过程中实现了某个功能，觉得对其他人也有帮助，欢迎提交 PR 到 `develop` 分支。审查通过后，我会合并并部署到线上 demo 供大家试用。

**如何贡献：**

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 按照 BMAD 工作流实现你的功能
4. 确保所有测试通过：`pnpm test`
5. 提交 PR 到 `develop` 分支

---

祝你练习愉快！愿 AI 代理们为你服务周到。
