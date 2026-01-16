# 部署指南

本文档介绍如何将 bmad-starter-kit 项目部署到免费平台：
- **后端**: Render (Node.js 托管)
- **前端**: surge.sh (静态托管)

---

## 一、后端部署 (Render)

### 步骤 1: 注册 Render

访问 https://render.com 并注册/登录账号。

### 步骤 2: 创建 Web Service

1. 点击 **New** → **Web Service**
2. 连接 GitHub 仓库 `bmad-starter-kit`
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Name | `bmad-starter-kit-api` |
| Environment | `Node` |
| Region | **Singapore** (离国内较近) |
| Branch | `develop` |
| Root Directory | `apps/api` |
| Build Command | `pnpm install --prod=false && pnpm run build` |
| Start Command | `npm run start:prod` |
| Instance Type | **Free** |

### 步骤 3: 配置环境变量

在 Render Dashboard → Environment 中添加以下环境变量：

```bash
# 数据库连接 (使用 Supabase Transaction mode pooler)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# JWT 配置
JWT_SECRET=your-production-secret-key-change-this
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# 服务配置
PORT=3000
NODE_ENV=production

# CORS 配置 (部署完前端后更新)
FRONTEND_URL=https://bmad-starter-kit.surge.sh
```

> **注意**: Supabase 连接需要使用 **Transaction mode** pooler，端口是 `6543` 而不是 `5432`。

### 步骤 4: 部署

点击 **Create Web Service** 开始部署。Render 会自动：
1. 从 GitHub 拉取代码
2. 安装依赖 (`pnpm install`)
3. 构建项目 (`nest build`)
4. 启动服务 (`node dist/main`)

部署完成后，你会获得一个 URL，例如：
```
https://bmad-starter-kit-api.onrender.com
```

---

## 二、前端部署 (surge.sh)

### 快速部署（推荐）

```bash
cd apps/web
pnpm run deploy:surge
```

首次运行需要：
1. 输入邮箱注册 surge
2. 验证邮箱
3. 设置密码

### 手动部署步骤

#### 步骤 1: 安装 surge

```bash
npm install -g surge
```

#### 步骤 2: API 地址已配置

`apps/web/.env.production` 已配置为：
```bash
VITE_API_URL=https://bmad-starter-kit.onrender.com
```

#### 步骤 3: 构建并部署

```bash
cd apps/web
pnpm build
surge dist bmad-starter-kit.surge.sh
```

### 步骤 4: 更新后端 CORS

回到 Render Dashboard，更新 `FRONTEND_URL` 环境变量：

```bash
FRONTEND_URL=https://bmad-starter-kit.surge.sh
```

---

## 三、验证部署

### 1. 检查后端健康

```bash
curl https://bmad-starter-kit.onrender.com/
```

应返回：`{"status":"ok","message":"API is running"}`

### 2. 测试前端

1. 访问 `https://bmad-starter-kit.surge.sh`
2. 尝试登录/注册
3. 测试用户管理功能（需要 ADMIN 角色）

---

## 四、常见问题

### Render 免费版限制

- **冷启动**: 首次访问需要 15-30 秒启动时间
- **休眠**: 15 分钟无请求后会休眠
- **月限额**: 750 小时/月 (足够个人项目使用)

### Supabase 连接问题

如果遇到数据库连接错误，确认：
1. 使用 Transaction mode pooler (端口 `6543`)
2. DATABASE_URL 格式正确：
   ```
   postgresql://postgres.project_ref:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

### CORS 错误

确认 Render 环境变量中 `FRONTEND_URL` 与你的 surge 地址一致（包括 `https://`）。

---

## 五、更新部署

### 更新后端

1. 推送代码到 GitHub `develop` 分支
2. Render 会自动检测并重新部署

### 更新前端

```bash
cd apps/web
pnpm run deploy:surge
```

---

## 六、项目文件说明

| 文件 | 作用 |
|------|------|
| `apps/api/package.json` | 生产环境启动脚本 |
| `apps/web/.env.production` | 前端生产环境变量（API 地址） |
| `apps/web/deploy.sh` | 前端部署脚本 |
| `apps/web/package.json` | 包含 `pnpm run deploy` 命令 |
