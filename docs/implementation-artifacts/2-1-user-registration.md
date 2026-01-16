# Story 2.1: 用户注册功能

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为 新用户,
我想要 使用邮箱和密码注册账号,
以便 我可以开始使用 cuplayer 的功能.

## Acceptance Criteria

**Given** 后端 API 和数据库已就绪
**When** 用户提交注册请求 (email, password, name)
**Then** 验证邮箱格式符合标准
**And** 验证密码长度不少于 8 位
**And** 使用 bcrypt 加密密码 (salt rounds = 10)
**And** 在数据库创建 User 记录
**And** 返回 201 状态码和用户信息 (不含密码)
**And** 如果邮箱已存在，返回 409 状态码和错误信息

## Tasks / Subtasks

- [x] 1. 创建 Auth 模块结构 (AC: 全部)
  - [x] 1.1 创建 `apps/api/src/modules/auth/` 目录
  - [x] 1.2 创建 `auth.module.ts`
  - [x] 1.3 创建 `auth.controller.ts`
  - [x] 1.4 创建 `auth.service.ts`
  - [x] 1.5 创建 `dto/` 子目录

- [x] 2. 创建注册 DTO (AC: #1, #2, #3)
  - [x] 2.1 创建 `dto/register.dto.ts`
  - [x] 2.2 添加 email 验证 (IsEmail, IsNotEmpty)
  - [x] 2.3 添加 password 验证 (IsString, MinLength(8), IsNotEmpty)
  - [x] 2.4 添加 name 验证 (IsString, IsNotEmpty)
  - [x] 2.5 从 @cuplayer/shared 引入 CreateUserDto 作为补充

- [x] 3. 实现 AuthService 注册逻辑 (AC: #4, #5, #7)
  - [x] 3.1 注入 PrismaService
  - [x] 3.2 实现 register 方法
  - [x] 3.3 检查邮箱是否已存在 (Prisma @unique 约束)
  - [x] 3.4 使用 bcrypt 加密密码 (salt rounds = 10)
  - [x] 3.5 创建 User 记录到数据库
  - [x] 3.6 返回用户信息 (排除 password 字段)

- [x] 4. 实现 AuthController 注册端点 (AC: #6, #7, #8)
  - [x] 4.1 创建 POST /api/v1/auth/register 路由
  - [x] 4.2 使用 @Body() 接收 DTO
  - [x] 4.3 使用 class-validator 自动验证
  - [x] 4.4 返回 201 状态码和 ApiResponse<User>
  - [x] 4.5 处理邮箱已存在异常 (ConflictException)

- [x] 5. 安装和配置依赖 (AC: #4)
  - [x] 5.1 在 apps/api 安装 bcrypt 作为运行时依赖
  - [x] 5.2 安装 @types/bcrypt 作为开发依赖
  - [x] 5.3 安装 class-validator 和 class-transformer
  - [x] 5.4 在 main.ts 全局启用 ValidationPipe

- [x] 6. 更新 shared 类型 (如需要)
  - [x] 6.1 确认 CreateUserDto 在 @cuplayer/shared 中存在
  - [x] 6.2 如需要，补充缺失字段

- [x] 7. 集成到 AppModule
  - [x] 7.1 在 app.module.ts 中导入 AuthModule
  - [x] 7.2 验证模块正确加载

- [x] 8. 测试验证
  - [x] 8.1 使用 pnpm start:dev 启动后端
  - [x] 8.2 测试 POST /api/v1/auth/register 成功注册
  - [x] 8.3 测试重复邮箱返回 409
  - [x] 8.4 测试验证失败返回 400

## Dev Notes

### Epic Context

**Epic 2 目标**: 用户可以注册账号、登录系统并管理个人资料

这是 Epic 2 的第一个 Story。Epic 1 已完成:
- ✅ Story 1.1: 初始化 Monorepo 结构
- ✅ Story 1.2: 迁移前端代码到 apps/web
- ✅ Story 1.3: 创建 NestJS 后端骨架
- ✅ Story 1.4: 创建共享类型包
- ✅ Story 1.5: 配置 Prisma 和数据库连接

**本 Story 的重要性:**
用户注册是认证系统的基础，它建立了:
1. User 表的数据写入模式
2. 密码加密的安全标准
3. API 验证和错误处理模式
4. Auth 模块的基础结构

**后续 Story 依赖:**
- Story 2.2 (用户登录) 将复用 User 查询和密码验证逻辑
- Story 2.3 (JWT Guard) 将基于注册后的用户信息生成 Token
- Story 2.4 (UI 集成) 将对接此注册 API

### Architecture Compliance

**认证架构决策** (来源: `docs/planning-artifacts/architecture.md#Authentication & Security`)

```
| 决策 | 方案 | 版本 |
|------|------|------|
| 认证方式 | JWT (Access + Refresh Token) | @nestjs/jwt |
| 密码加密 | bcrypt | bcrypt |
| Cookie 安全 | HttpOnly + Secure | - |
| Guard 机制 | NestJS Guards | 内置 |
```

**API 路由结构** (来源: `docs/planning-artifacts/architecture.md#API Design Patterns`)

```
/api/v1/auth           # 认证相关
  POST   /register     # 注册 ← 本 Story
  POST   /login        # 登录 (Story 2.2)
  POST   /logout       # 登出 (Story 2.5)
```

**HTTP 状态码规范** (来源: `docs/planning-artifacts/architecture.md#Error Handling Standards`)

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 201 | 创建成功 | POST 创建资源成功 |
| 400 | 请求错误 | 参数验证失败 |
| 409 | 冲突 | 资源已存在 (邮箱重复) |

**统一响应格式**:
```typescript
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  errors?: ValidationError[];
}
```

### Previous Story Intelligence

**Story 1.5 完成总结** (来源: `docs/implementation-artifacts/1-5-prisma-setup.md`)

Story 1.5 成功配置了 Prisma 7.x:
- ✅ 创建了 `apps/api/prisma/schema.prisma` 文件
- ✅ 创建了 `apps/api/prisma.config.ts` (Prisma 7 新配置方式)
- ✅ 创建了 `PrismaService` (使用 PrismaPg adapter)
- ✅ 创建了 `PrismaModule` (@Global 装饰器)
- ✅ User 模型已定义: `id`, `email`, `password`, `name`, `createdAt`

**Prisma 7.x 重要模式**:
```typescript
// PrismaService 使用方式
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  async onModuleInit() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get client() {
    return this.prisma;
  }
}
```

**关键经验教训:**
1. **PrismaService 注入**: 使用 `@Injectable()` 装饰器，在 AuthService 中通过 `constructor(private prisma: PrismaService)` 注入
2. **数据库操作**: 使用 `this.prisma.client.user.create()` 等方法
3. **环境变量**: DATABASE_URL 在 `apps/api/.env` 中配置

**Story 1.4 完成总结** (来源: `docs/implementation-artifacts/1-4-shared-types.md`)

Story 1.4 创建了共享类型包:
- ✅ `CreateUserDto` 已在 `packages/shared/src/types/user.types.ts` 定义
- ✅ `ApiResponse<T>` 和 `ApiError` 已定义
- ✅ @cuplayer/shared 可在 apps/api 中导入

**可用类型**:
```typescript
// packages/shared/src/types/user.types.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
```

### Technical Requirements

**依赖安装**:
```bash
# bcrypt 密码加密
pnpm --filter @cuplayer/api add bcrypt
pnpm --filter @cuplayer/api add -D @types/bcrypt

# 数据验证
pnpm --filter @cuplayer/api add class-validator class-transformer
```

**NestJS 模块结构** (来源: `docs/planning-artifacts/architecture.md#Structure Patterns`)

```
apps/api/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   └── register.dto.ts
├── guards/         # 后续 Story 添加
└── strategies/     # 后续 Story 添加
```

**Register DTO 定义**:
```typescript
// dto/register.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于 8 位' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @IsString({ message: '姓名必须是字符串' })
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string;
}
```

**AuthService 实现**:
```typescript
// auth.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(email: string, password: string, name: string): Promise<Omit<User, 'password'>> {
    // 1. 检查邮箱是否已存在
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 2. 加密密码 (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 创建用户
    const user = await this.prisma.client.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      }
    });

    // 4. 返回用户信息 (不含密码)
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

**AuthController 实现**:
```typescript
// auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ApiResponse } from '@cuplayer/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<Omit<User, 'password'>>> {
    const user = await this.authService.register(dto.email, dto.password, dto.name);
    return {
      statusCode: 201,
      message: '注册成功',
      data: user,
    };
  }
}
```

**ValidationPipe 配置** (main.ts):
```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // ... 其他配置
}
```

**错误响应示例**:

成功注册 (201):
```json
{
  "statusCode": 201,
  "message": "注册成功",
  "data": {
    "id": "clxxxxxx",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2025-12-30T00:00:00.000Z"
  }
}
```

邮箱已存在 (409):
```json
{
  "statusCode": 409,
  "message": "该邮箱已被注册",
  "error": "Conflict"
}
```

验证失败 (400):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    { "field": "email", "message": "邮箱格式不正确" },
    { "field": "password", "message": "密码长度不能少于 8 位" }
  ]
}
```

### File Structure Requirements

**目标文件结构**:
```
apps/api/src/
├── modules/
│   └── auth/
│       ├── auth.module.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── dto/
│           └── register.dto.ts
├── prisma/
│   ├── schema.prisma        # 已存在
│   └── prisma.service.ts    # 已存在
├── main.ts                  # 需要更新 (添加 ValidationPipe)
└── app.module.ts            # 需要更新 (导入 AuthModule)
```

### Project Structure Notes

**Monorepo 集成**:
1. 依赖安装使用 `pnpm --filter @cuplayer/api add ...`
2. shared 类型导入使用 `import { ... } from '@cuplayer/shared'`
3. PrismaService 通过 @Global 装饰器全局可用，无需在 AuthModule 的 imports 中声明

**与后续 Story 的衔接**:
- **Story 2.2 (登录)**: 复用 AuthService 的用户查询和 bcrypt.compare 验证
- **Story 2.3 (JWT Guard)**: 基于注册后的 User 信息生成 JWT Token
- **Story 2.4 (UI)**: 前端调用 POST /api/v1/auth/register 完成注册流程

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **密码明文存储**
   - 密码必须使用 bcrypt 加密后存储

2. **返回密码字段**
   - 响应中必须排除 password 字段

3. **忽略输入验证**
   - 必须使用 class-validator 验证输入

4. **错误状态码不正确**
   - 邮箱已存在返回 409，不是 400 或 500
   - 验证失败返回 400

5. **不使用统一响应格式**
   - 必须遵循 ApiResponse 格式

**✅ 正确做法:**

1. 使用 bcrypt 加密，salt rounds = 10
2. 返回前使用解构排除 password 字段
3. 使用 class-validator 和 ValidationPipe
4. 遵循 HTTP 状态码规范
5. 使用 ApiResponse 包装成功响应

### Testing Requirements

**验证清单:**

1. **依赖正确安装**
   - [ ] bcrypt 已安装
   - [ ] @types/bcrypt 已安装
   - [ ] class-validator 已安装
   - [ ] class-transformer 已安装

2. **模块结构正确**
   - [ ] auth/ 目录存在
   - [ ] auth.module.ts, auth.controller.ts, auth.service.ts 存在
   - [ ] dto/register.dto.ts 存在

3. **注册功能验证**
   - [ ] 成功注册返回 201 和用户信息
   - [ ] 密码已加密存储 (非明文)
   - [ ] 重复邮箱返回 409
   - [ ] 验证失败返回 400 和详细错误信息
   - [ ] 响应中不含 password 字段

4. **集成验证**
   - [ ] 后端正常启动无报错
   - [ ] AuthModule 在 AppModule 中正确加载
   - [ ] POST /api/v1/auth/register 端点可访问

**测试命令:**
```bash
# 1. 启动后端
pnpm --filter @cuplayer/api start:dev

# 2. 测试注册成功
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"12345678","name":"测试"}'

# 3. 测试重复邮箱 (应返回 409)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"12345678","name":"测试2"}'

# 4. 测试验证失败 (应返回 400)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"123","name":""}'
```

### Git Intelligence

**最近相关提交:**
```
4145107 完成 Epic 1: Story 1.5 Prisma 配置和 Epic 1 回顾
9bb6991 完成 Story 1.4: 创建共享类型包
dee7594 完成 Story 1.3: 创建 NestJS 后端骨架
```

**本 Story 影响:**
- 新增 `apps/api/src/modules/auth/` 目录和文件
- 修改 `apps/api/package.json` (添加 bcrypt, class-validator)
- 修改 `apps/api/src/main.ts` (添加 ValidationPipe)
- 修改 `apps/api/src/app.module.ts` (导入 AuthModule)

### References

**架构文档引用:**
- 认证架构: [Source: docs/planning-artifacts/architecture.md#Authentication & Security]
- API 路由结构: [Source: docs/planning-artifacts/architecture.md#API Design Patterns]
- 错误处理标准: [Source: docs/planning-artifacts/architecture.md#Error Handling Standards]
- NestJS 模块结构: [Source: docs/planning-artifacts/architecture.md#Structure Patterns]
- Prisma Schema: [Source: docs/planning-artifacts/architecture.md#Data Architecture]

**Epic 文档引用:**
- Story 2.1 完整定义: [Source: docs/planning-artifacts/epics.md#Story 2.1]
- Epic 2 总览: [Source: docs/planning-artifacts/epics.md#Epic 2]

**共享类型引用:**
- CreateUserDto: [Source: packages/shared/src/types/user.types.ts]

**前序 Story 文档:**
- Story 1.5 实现: [Source: docs/implementation-artifacts/1-5-prisma-setup.md]
- Story 1.4 实现: [Source: docs/implementation-artifacts/1-4-shared-types.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required.

### Completion Notes List

1. **Prisma 版本降级**: 由于 Prisma 7.x 的 driver adapter 模式与 NestJS 的 Webpack 打包存在兼容性问题，将 Prisma 从 7.2.0 降级到 6.19.1。Prisma 6.x 使用传统的 DATABASE_URL 连接方式，与 Webpack 兼容性更好。

2. **PrismaService 简化**: 移除了 Prisma 7.x 的 PrismaPg adapter 和 Pool 配置，改用标准的 PrismaClient 构造方式。

3. **所有验收标准已通过**:
   - ✅ 成功注册返回 201 和用户信息 (不含 password)
   - ✅ 密码使用 bcrypt 加密 (salt rounds = 10)
   - ✅ 重复邮箱返回 409 Conflict
   - ✅ 验证失败返回 400 Bad Request (邮箱格式、密码长度、姓名不能为空)

4. **代码审查修复 (2025-12-31)**:
   - ✅ 修复 Prisma Schema User.name 类型 (从可选改为必填)
   - ✅ RegisterDto 实现 CreateUserDto 接口
   - ✅ 添加自定义异常过滤器统一错误响应格式
   - ✅ 添加注册端点速率限制 (5次/15分钟)
   - ✅ 改进密码验证 (大小写+数字)
   - ✅ 添加 PrismaService 错误处理和日志
   - ✅ 修复 CORS 配置安全性
   - ✅ 添加 @nestjs/throttler 依赖

### File List

**新增文件:**
- `apps/api/src/modules/auth/auth.module.ts` - Auth 模块定义
- `apps/api/src/modules/auth/auth.controller.ts` - 注册端点控制器 (含速率限制)
- `apps/api/src/modules/auth/auth.service.ts` - 注册业务逻辑 (密码加密、用户创建)
- `apps/api/src/modules/auth/dto/register.dto.ts` - 注册 DTO 及验证规则 (实现 CreateUserDto)
- `apps/api/webpack-hmr.config.js` - Webpack 配置 (用于 Prisma 兼容性)
- `apps/api/src/common/filters/validation-exception.filter.ts` - 统一异常响应格式过滤器

**测试文件 (单元测试 + 集成测试):**
- `apps/api/jest.config.js` - 单元测试配置
- `apps/api/jest-e2e.config.js` - 集成测试配置
- `apps/api/test/jest-setup.ts` - 全局测试配置 (bcrypt mock)
- `apps/api/test/auth.e2e-spec.ts` - API 集成测试 (10 个测试)
- `apps/api/src/modules/auth/auth.service.spec.ts` - AuthService 单元测试
- `apps/api/src/modules/auth/auth.controller.spec.ts` - AuthController 单元测试
- `apps/api/src/modules/auth/dto/register.dto.spec.ts` - RegisterDto 单元测试
- `apps/api/src/prisma/prisma.service.spec.ts` - PrismaService 单元测试

**修改文件:**
- `apps/api/src/main.ts` - 添加 ValidationPipe、AllExceptionsFilter、改进 CORS 配置
- `apps/api/src/app.module.ts` - 导入 AuthModule、配置 ThrottlerModule
- `apps/api/prisma/schema.prisma` - User.name 改为必填字段
- `apps/api/src/prisma/prisma.service.ts` - 添加错误处理和 Logger
- `apps/api/nest-cli.json` - 配置 webpack 和 webpackConfigPath
- `apps/api/package.json` - 添加 bcrypt, class-validator, class-transformer, @nestjs/throttler, jest 相关依赖
- `packages/shared/src/types/user.types.ts` - User.name 改为非可选类型

**删除文件:**
- `apps/api/prisma.config.ts` - Prisma 7.x 配置文件 (降级到 Prisma 6.x 后移除)
