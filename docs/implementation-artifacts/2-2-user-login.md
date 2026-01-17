# Story 2.2: 用户登录功能

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为 已注册用户,
我想要 使用邮箱和密码登录,
以便 我可以访问我的账户和受保护的功能.

## Acceptance Criteria

**Given** 用户已注册 (Story 2.1 完成)
**When** 用户提交登录请求 (email, password)
**Then** 验证邮箱和密码是否匹配
**And** 生成 Access Token (15分钟有效期)
**And** 生成 Refresh Token (7天有效期)
**And** Refresh Token 存储在 HttpOnly Cookie 中
**And** 返回 200 状态码和 Access Token
**And** 如果登录失败，返回 401 状态码和错误信息

## Tasks / Subtasks

- [x] 1. 安装和配置 JWT 依赖 (AC: #2, #3)
  - [x] 1.1 安装 @nestjs/jwt 和 @nestjs/passport
  - [x] 1.2 安装 passport 和 passport-jwt
  - [x] 1.3 配置 JWT 环境变量 (JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN)
  - [x] 1.4 在 AuthModule 中导入 JwtModule

- [x] 2. 创建登录 DTO (AC: #1)
  - [x] 2.1 创建 `dto/login.dto.ts`
  - [x] 2.2 添加 email 验证 (IsEmail, IsNotEmpty)
  - [x] 2.3 添加 password 验证 (IsString, IsNotEmpty)
  - [x] 2.4 从 @bmad-starter-kit/shared 引入 LoginDto 作为补充

- [x] 3. 实现 AuthService 登录逻辑 (AC: #1, #2, #3, #4, #7)
  - [x] 3.1 添加 validateUser 方法 (验证邮箱密码)
  - [x] 3.2 使用 bcrypt.compare 验证密码
  - [x] 3.3 实现 login 方法
  - [x] 3.4 生成 Access Token (15分钟 = 900秒)
  - [x] 3.5 生成 Refresh Token (7天 = 604800秒)
  - [x] 3.6 返回 LoginResponseDto { accessToken, user }

- [x] 4. 实现 AuthController 登录端点 (AC: #6, #7, #8)
  - [x] 4.1 创建 POST /api/v1/auth/login 路由
  - [x] 4.2 使用 @Body() 接收 LoginDto
  - [x] 4.3 使用 class-validator 自动验证
  - [x] 4.4 返回 200 状态码和 ApiResponse<LoginResponseDto>
  - [x] 4.5 处理登录失败异常 (UnauthorizedException)
  - [x] 4.6 设置 HttpOnly Cookie 存储 Refresh Token

- [x] 5. 更新 shared 类型 (AC: #6, #7)
  - [x] 5.1 在 @bmad-starter-kit/shared 中添加 LoginResponseDto 接口
  - [x] 5.2 定义 TokenPayload 类型 (sub, email)

- [x] 6. 创建 JwtStrategy (为 Story 2.3 准备)
  - [x] 6.1 创建 `strategies/jwt.strategy.ts`
  - [x] 6.2 实现 JWT 验证逻辑
  - [x] 6.3 配置 Strategy 从 Authorization Header 提取 Token

- [x] 7. 测试验证
  - [x] 7.1 使用 pnpm start:dev 启动后端
  - [x] 7.2 先注册一个测试用户 (使用 Story 2.1 接口)
  - [x] 7.3 测试 POST /api/v1/auth/login 成功登录
  - [x] 7.4 验证 Access Token 可以解析
  - [x] 7.5 验证 Refresh Token 在 HttpOnly Cookie 中
  - [x] 7.6 测试错误密码返回 401
  - [x] 7.7 测试不存在的邮箱返回 401

## Dev Notes

### Epic Context

**Epic 2 目标**: 用户可以注册账号、登录系统并管理个人资料

这是 Epic 2 的第二个 Story。Story 2.1 (用户注册) 已完成:
- ✅ Story 2.1: 用户注册功能 - 创建 User 表、密码加密、注册 API

**本 Story 的重要性:**
用户登录是认证系统的核心，它建立了:
1. JWT Token 生成和验证机制
2. Access Token + Refresh Token 双 Token 策略
3. HttpOnly Cookie 安全存储模式
4. 用户会话管理基础

**后续 Story 依赖:**
- Story 2.3 (JWT Guard) 将使用本 Story 的 Access Token 验证机制
- Story 2.4 (UI 集成) 将对接此登录 API
- Story 2.5 (登出) 将清除本 Story 设置的 Refresh Token Cookie

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

**Token 策略**:
```
Access Token:  15分钟有效期 (900秒)
Refresh Token:  7天有效期 (604800秒)
```

**API 路由结构** (来源: `docs/planning-artifacts/architecture.md#API Design Patterns`)

```
/api/v1/auth           # 认证相关
  POST   /register     # 注册 ← Story 2.1
  POST   /login        # 登录 ← 本 Story
  POST   /logout       # 登出 (Story 2.5)
  POST   /refresh      # 刷新 token (可选)
```

**HTTP 状态码规范** (来源: `docs/planning-artifacts/architecture.md#Error Handling Standards`)

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 登录成功，返回 Token |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未认证 | 邮箱或密码错误 |

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
}
```

### Previous Story Intelligence

**Story 2.1 完成总结** (来源: `docs/implementation-artifacts/2-1-user-registration.md`)

Story 2.1 成功实现了用户注册:
- ✅ 创建了 `apps/api/src/modules/auth/` 目录结构
- ✅ 实现了 AuthService.register 方法 (bcrypt 密码加密)
- ✅ 实现了 AuthController POST /register 端点
- ✅ RegisterDto 验证规则 (邮箱格式、密码长度、姓名必填)
- ✅ Prisma 6.19.1 (PrismaService 使用标准连接方式)
- ✅ 全局 ValidationPipe 配置
- ✅ 速率限制 (5次/15分钟)

**可复用的代码模式**:
```typescript
// AuthService 中已有的密码验证模式
import * as bcrypt from 'bcrypt';

// 用户查找 (已实现)
const user = await this.prisma.client.user.findUnique({
  where: { email }
});

// 密码验证 (本 Story 需要使用)
const isPasswordValid = await bcrypt.compare(password, user.password);
```

**PrismaService 注入模式**:
```typescript
// auth.service.ts (已存在)
constructor(private prisma: PrismaService) {}

// 使用方式
this.prisma.client.user.findUnique({ ... })
```

**可用的共享类型**:
```typescript
// packages/shared/src/types/user.types.ts (已存在)
export interface LoginDto {
  email: string;
  password: string;
}
```

**已安装的依赖**:
- ✅ bcrypt (密码验证)
- ✅ @types/bcrypt
- ✅ class-validator
- ✅ class-transformer

**本 Story 需要新增的依赖**:
- @nestjs/jwt (JWT 生成)
- @nestjs/passport (Passport 集成)
- passport (认证中间件)
- passport-jwt (JWT 策略)
- @types/passport-jwt

### Technical Requirements

**新增依赖安装**:
```bash
# JWT 认证
pnpm --filter @bmad-starter-kit/api add @nestjs/jwt
pnpm --filter @bmad-starter-kit/api add @nestjs/passport passport passport-jwt
pnpm --filter @bmad-starter-kit/api add -D @types/passport-jwt
```

**环境变量配置** (`.env`):
```bash
# JWT 配置
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Cookie 配置
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false  # 开发环境设为 false，生产环境设为 true
COOKIE_SAME_SITE=lax
```

**AuthModule 配置更新**:
```typescript
// auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

**Login DTO 定义**:
```typescript
// dto/login.dto.ts
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
```

**AuthService 实现**:
```typescript
// auth.service.ts (扩展现有服务)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 验证用户 (用于登录)
  async validateUser(email: string, password: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // 返回不含密码的用户信息
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // 登录方法
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // Token Payload
    const payload = { sub: user.id, email: user.email };

    // 生成 Access Token (15分钟)
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    // 生成 Refresh Token (7天)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }
}
```

**AuthController 实现**:
```typescript
// auth.controller.ts (扩展现有控制器)
import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '@bmad-starter-kit/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.authService.login(dto.email, dto.password);

    // 设置 HttpOnly Cookie 存储 Refresh Token
    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      path: '/',
    });

    return {
      statusCode: 200,
      message: '登录成功',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }
}
```

**JwtStrategy 实现** (为 Story 2.3 准备):
```typescript
// strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

**登录响应示例**:

成功登录 (200):
```json
{
  "statusCode": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxxxxx",
      "email": "user@example.com",
      "name": "张三",
      "createdAt": "2025-12-30T00:00:00.000Z"
    }
  }
}
```

Cookie 响应头:
```
Set-Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax
```

登录失败 (401):
```json
{
  "statusCode": 401,
  "message": "邮箱或密码错误",
  "error": "Unauthorized"
}
```

验证失败 (400):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    { "field": "email", "message": "邮箱格式不正确" }
  ]
}
```

**共享类型更新** (`packages/shared/src/types/user.types.ts`):
```typescript
// 添加登录响应类型
export interface LoginResponseDto {
  accessToken: string;
  user: User;
}

export interface TokenPayload {
  sub: string;  // 用户 ID
  email: string;
  iat?: number;
  exp?: number;
}
```

### File Structure Requirements

**目标文件结构**:
```
apps/api/src/
├── modules/
│   └── auth/
│       ├── auth.module.ts          # 需要更新 (添加 JwtModule, PassportModule)
│       ├── auth.controller.ts      # 需要更新 (添加 login 端点)
│       ├── auth.service.ts         # 需要更新 (添加 validateUser, login 方法)
│       ├── dto/
│       │   ├── register.dto.ts     # 已存在
│       │   └── login.dto.ts        # 新增
│       └── strategies/
│           └── jwt.strategy.ts     # 新增 (为 Story 2.3 准备)
├── prisma/
│   ├── schema.prisma               # 已存在
│   └── prisma.service.ts           # 已存在
├── main.ts                         # 已配置 ValidationPipe
└── app.module.ts                   # 已存在 AuthModule
```

### Project Structure Notes

**Monorepo 集成**:
1. 依赖安装使用 `pnpm --filter @bmad-starter-kit/api add ...`
2. shared 类型导入使用 `import { ... } from '@bmad-starter-kit/shared'`
3. LoginDto 已在 @bmad-starter-kit/shared 中定义，可直接使用或扩展

**与后续 Story 的衔接**:
- **Story 2.3 (JWT Guard)**: 使用本 Story 的 JwtStrategy 验证 Access Token
- **Story 2.4 (UI)**: 前端调用 POST /api/v1/auth/login，存储 Access Token 到内存
- **Story 2.5 (登出)**: 清除本 Story 设置的 refresh_token Cookie

**Cookie 安全注意事项**:
1. 开发环境: `secure: false` (因为使用 HTTP)
2. 生产环境: `secure: true` (必须使用 HTTPS)
3. `httpOnly: true` 防止 XSS 攻击窃取 Token
4. `sameSite: lax` 防止 CSRF 攻击

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **密码比较使用明文**
   - 必须使用 bcrypt.compare 验证密码

2. **返回用户密码**
   - 响应中必须排除 password 字段

3. **Token 有效期配置错误**
   - Access Token 必须是 15 分钟
   - Refresh Token 必须是 7 天

4. **Refresh Token 暴露在响应中**
   - Refresh Token 只能放在 HttpOnly Cookie 中
   - 响应中只返回 Access Token

5. **Cookie 配置不安全**
   - 必须设置 httpOnly: true
   - 生产环境必须设置 secure: true

6. **JWT_SECRET 使用默认值**
   - 生产环境必须使用强随机密钥
   - 建议使用环境变量，不要硬编码

**✅ 正确做法:**

1. 使用 bcrypt.compare 验证密码
2. 返回前解构排除 password 字段
3. Access Token 15分钟，Refresh Token 7天
4. Refresh Token 只在 Cookie 中，响应不返回
5. Cookie 设置 httpOnly + secure (生产环境)
6. JWT_SECRET 使用环境变量，生产环境强密钥

### Testing Requirements

**验证清单:**

1. **依赖正确安装**
   - [ ] @nestjs/jwt 已安装
   - [ ] @nestjs/passport 已安装
   - [ ] passport 已安装
   - [ ] passport-jwt 已安装
   - [ ] @types/passport-jwt 已安装

2. **环境变量配置**
   - [ ] JWT_SECRET 已设置
   - [ ] JWT_EXPIRES_IN 已设置 (或使用默认值)
   - [ ] REFRESH_TOKEN_EXPIRES_IN 已设置 (或使用默认值)

3. **登录功能验证**
   - [ ] 正确登录返回 200 和 Access Token
   - [ ] Access Token 可以解析出正确的用户信息
   - [ ] Refresh Token 在 HttpOnly Cookie 中
   - [ ] 错误密码返回 401
   - [ ] 不存在的邮箱返回 401
   - [ ] 响应中不含 password 字段
   - [ ] 响应中不含 Refresh Token (只在 Cookie 中)

4. **Token 验证**
   - [ ] Access Token 有效期为 15 分钟
   - [ ] Refresh Token 有效期为 7 天
   - [ ] Token Payload 包含 sub 和 email

5. **集成验证**
   - [ ] 后端正常启动无报错
   - [ ] POST /api/v1/auth/login 端点可访问

**测试命令:**
```bash
# 1. 启动后端
pnpm --filter @bmad-starter-kit/api start:dev

# 2. 先注册一个测试用户 (如果还没有)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"测试"}'

# 3. 测试登录成功
curl -v -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 4. 验证响应中的 accessToken
# 5. 验证响应头中的 Set-Cookie (refresh_token)

# 6. 测试错误密码 (应返回 401)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword"}'

# 7. 测试不存在的邮箱 (应返回 401)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notexist@example.com","password":"Test1234"}'

# 8. 解码并验证 Access Token
# 在 https://jwt.io/ 或使用命令:
echo "YOUR_ACCESS_TOKEN" | awk -F. '{print $2}' | base64 -d
```

### Git Intelligence

**最近相关提交:**
```
4b4387f 完成 Story 2.1: 用户注册功能
4145107 完成 Epic 1: Story 1.5 Prisma 配置和 Epic 1 回顾
9bb6991 完成 Story 1.4: 创建共享类型包
```

**本 Story 影响:**
- 修改 `apps/api/package.json` (添加 JWT 相关依赖)
- 修改 `apps/api/src/modules/auth/auth.module.ts` (导入 JwtModule)
- 修改 `apps/api/src/modules/auth/auth.service.ts` (添加登录逻辑)
- 修改 `apps/api/src/modules/auth/auth.controller.ts` (添加登录端点)
- 新增 `apps/api/src/modules/auth/dto/login.dto.ts`
- 新增 `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- 修改 `packages/shared/src/types/user.types.ts` (添加 LoginResponseDto)
- 新增 `apps/api/.env` (JWT_SECRET 等环境变量)

### References

**架构文档引用:**
- 认证架构: [Source: docs/planning-artifacts/architecture.md#Authentication & Security]
- Token 策略: [Source: docs/planning-artifacts/architecture.md#Token 策略]
- API 路由结构: [Source: docs/planning-artifacts/architecture.md#API Design Patterns]
- 错误处理标准: [Source: docs/planning-artifacts/architecture.md#Error Handling Standards]
- Cookie 安全: [Source: docs/planning-artifacts/architecture.md#Cookie 安全]

**Epic 文档引用:**
- Story 2.2 完整定义: [Source: docs/planning-artifacts/epics.md#Story 2.2]
- Epic 2 总览: [Source: docs/planning-artifacts/epics.md#Epic 2]

**共享类型引用:**
- LoginDto: [Source: packages/shared/src/types/user.types.ts]
- ApiResponse: [Source: packages/shared/src/types/api.types.ts]

**前序 Story 文档:**
- Story 2.1 实现: [Source: docs/implementation-artifacts/2-1-user-registration.md]
- Story 1.5 实现: [Source: docs/implementation-artifacts/1-5-prisma-setup.md]

**NestJS 官方文档:**
- JWT: https://docs.nestjs.com/security/authentication#jwt-functionality
- Passport: https://docs.nestjs.com/security/authentication#passport

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required during story creation.

### Completion Notes List

Story 实现完成，关键要点:

1. **JWT 双 Token 架构**: Access Token (15分钟) 用于 API 认证，Refresh Token (7天) 用于刷新

2. **安全存储模式**: Refresh Token 仅存储在 HttpOnly Cookie 中，不暴露在 JavaScript

3. **密码验证**: 使用 bcrypt.compare 验证，复用 Story 2.1 的加密方式

4. **为后续 Story 准备**: JwtStrategy 为 Story 2.3 (JWT Guard) 提供基础

5. **环境变量**: JWT_SECRET 必须在生产环境使用强密钥

6. **修复问题**: 修复了 main.ts 中 ValidationPipe 的 exceptionFactory，使其正确抛出 BadRequestException

### Code Review Fixes (2025-12-31)

代码审查发现并修复了以下问题:

**HIGH 优先级修复:**
- ✅ 移除 JWT_SECRET 默认值 - auth.module.ts 和 jwt.strategy.ts 现在会在 JWT_SECRET 未设置时抛出错误，防止使用弱密钥
- ✅ 显式指定 Access Token 有效期 - login() 方法现在显式传入 expiresIn: '15m'
- ✅ 移除 Refresh Token 生成时的冗余 secret 参数
- ✅ 创建 .env.example 文件作为环境变量模板

**MEDIUM 优先级修复:**
- ✅ 统一登录和注册的速率限制 - 登录端点现在也是 5次/15分钟（之前是 10次）
- ✅ 更新 .env.example 包含所有必需的环境变量说明

**安全提醒:**
- ⚠️ .env 文件包含生产数据库密码，不应提交到 Git（已在 .gitignore 中）
- ⚠️ 建议轮换已暴露在代码中的数据库密码

### File List

**Created Files:**
- `apps/api/src/modules/auth/dto/login.dto.ts` - Login DTO with validation
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - JWT Strategy for Passport
- `apps/api/.env.example` - Environment variables template (code review addition)

**Modified Files:**
- `apps/api/package.json` - Added JWT dependencies (@nestjs/jwt, @nestjs/passport, passport, passport-jwt, express, @types/express, @types/passport-jwt)
- `apps/api/.env` - Added JWT configuration (should not be committed - use .env.example)
- `apps/api/src/main.ts` - Fixed ValidationPipe exceptionFactory to throw BadRequestException
- `apps/api/src/modules/auth/auth.module.ts` - Added JwtModule and PassportModule imports, JWT_SECRET validation
- `apps/api/src/modules/auth/auth.service.ts` - Added validateUser and login methods, explicit token expiration
- `apps/api/src/modules/auth/auth.controller.ts` - Added POST /login endpoint, unified rate limiting
- `packages/shared/src/types/user.types.ts` - Added LoginResponseDto and TokenPayload types
- `packages/shared/src/types/index.ts` - Exported new types

## Change Log

**2025-12-31**
- 实现 JWT 双 Token 认证系统
- 添加 LoginDto 和 LoginResponseDto 类型
- 创建 JwtStrategy 为后续 Guard 准备
- 修复 ValidationPipe 异常处理
- 完成所有测试验证

**Code Review Fixes (2025-12-31):**
- 移除 JWT_SECRET 默认值，添加启动时验证
- 显式指定 Access Token 有效期
- 统一登录/注册速率限制为 5次/15分钟
- 创建 .env.example 模板文件
