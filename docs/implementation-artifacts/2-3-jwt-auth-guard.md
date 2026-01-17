# Story 2.3: JWT 认证守卫

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为 开发者,
我想要 创建 JWT 认证守卫机制,
以便 保护需要登录才能访问的 API 路由.

## Acceptance Criteria

**Given** JWT 认证已配置 (Story 2.2 完成)
**When** 请求携带有效 Access Token 访问受保护路由
**Then** JWT Guard 验证 Token 有效性
**And** 将用户信息注入到请求上下文
**And** 请求正常处理
**And** 如果 Token 无效或缺失，返回 401 状态码

## Tasks / Subtasks

- [x] 1. 创建 JwtAuthGuard (AC: #1, #4)
  - [x] 1.1 创建 `apps/api/src/modules/auth/guards/` 目录
  - [x] 1.2 创建 `jwt-auth.guard.ts`
  - [x] 1.3 继承 AuthGuard('jwt') 并实现 canActivate
  - [x] 1.4 处理 Token 过期和无效情况

- [x] 2. 创建 CurrentUser 装饰器 (AC: #2)
  - [x] 2.1 创建 `apps/api/src/common/decorators/` 目录
  - [x] 2.2 创建 `current-user.decorator.ts`
  - [x] 2.3 使用 @createParamDecorator 从 request 提取用户

- [x] 3. 在受保护路由应用 Guard (AC: #3, #4)
  - [x] 3.1 选择一个测试路由 (如 GET /api/v1/users/me)
  - [x] 3.2 应用 @UseGuards(JwtAuthGuard)
  - [x] 3.3 使用 @CurrentUser() 装饰器获取用户信息

- [x] 4. 配置公开路由 (可选)
  - [x] 4.1 确保 /api/v1/auth/register 和 /api/v1/auth/login 保持公开
  - [x] 4.2 其他需要公开的路由也可以设置 @Public() 装饰器

- [x] 5. 测试验证
  - [x] 5.1 测试有效 Token 可以访问受保护路由
  - [x] 5.2 测试无效 Token 返回 401
  - [x] 5.3 测试缺失 Token 返回 401
  - [x] 5.4 测试过期 Token 返回 401
  - [x] 5.5 测试公开路由无需 Token

## Dev Notes

### Epic Context

**Epic 2 目标**: 用户可以注册账号、登录系统并管理个人资料

这是 Epic 2 的第三个 Story。前序 Story 已完成:
- ✅ Story 2.1: 用户注册功能 - 创建 User 表、密码加密、注册 API
- ✅ Story 2.2: 用户登录功能 - JWT Token 生成、登录 API、JwtStrategy

**本 Story 的重要性:**
JWT 认证守卫是保护受保护资源的核心机制:
1. 验证请求中的 Access Token 有效性
2. 将已认证用户信息注入到请求上下文
3. 拦截未认证请求并返回 401
4. 为后续所有需要认证的 API 提供保护

**后续 Story 依赖:**
- Story 2.4 (UI 集成) 将调用受保护的 API
- Story 2.5 (登出) 使用已认证状态
- Story 2.6 (个人资料管理) 需要获取当前用户信息
- Epic 3 (视频管理) 所有 API 都需要此 Guard

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

**认证拦截器链** (来源: `docs/planning-artifacts/architecture.md#Cross-Cutting Concerns`)

```
Request → JWT Guard → Ownership Guard → Controller
           (验证token)  (验证资源所有权)
```

**公开路由（无需认证）**:
- `/public/videos/:id` - 视频播放页
- `/public/albums/:id` - 专辑播放页
- `/api/v1/auth/register` - 注册
- `/api/v1/auth/login` - 登录

**需要认证的路由**:
- 所有 `/api/v1/*` 路由 (除了 auth/register 和 auth/login)

**HTTP 状态码规范** (来源: `docs/planning-artifacts/architecture.md#Error Handling Standards`)

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 认证成功，请求正常处理 |
| 401 | 未认证 | Token 缺失或无效 |

### Previous Story Intelligence

**Story 2.2 完成总结** (来源: `docs/implementation-artifacts/2-2-user-login.md`)

Story 2.2 成功实现了用户登录和 JWT Token 生成:
- ✅ 安装了 @nestjs/jwt, @nestjs/passport, passport, passport-jwt
- ✅ 创建了 JwtStrategy (`strategies/jwt.strategy.ts`)
- ✅ 配置了 JWT 从 Authorization Header 提取 Token
- ✅ 实现了 AuthService.login 和 AuthService.validateUser
- ✅ Access Token 有效期 15 分钟
- ✅ Refresh Token 存储在 HttpOnly Cookie 中

**可复用的代码模式**:

JwtStrategy 已创建 (`apps/api/src/modules/auth/strategies/jwt.strategy.ts`):
```typescript
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

**AuthModule 当前配置**:
```typescript
// auth.module.ts
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

**Token Payload 结构** (来自 Story 2.2):
```typescript
interface TokenPayload {
  sub: string;  // 用户 ID
  email: string;
  iat?: number;
  exp?: number;
}
```

**关键经验教训:**
1. **JwtStrategy 已配置**: validate 方法返回 `{ userId, email }` 格式
2. **JWT_SECRET 验证**: 已在 AuthModule 中验证 JWT_SECRET 必须设置
3. **Passport 集成**: JwtStrategy 已注册到 Passport，可被 AuthGuard('jwt') 使用

**Story 2.1 完成总结** (来源: `docs/implementation-artifacts/2-1-user-registration.md`)

Story 2.1 创建了 Auth 模块基础结构:
- ✅ `apps/api/src/modules/auth/` 目录
- ✅ auth.module.ts, auth.controller.ts, auth.service.ts
- ✅ dto/ 子目录
- ✅ PrismaService 全局可用 (@Global 装饰器)

### Technical Requirements

**依赖已安装** (来自 Story 2.2):
- ✅ @nestjs/jwt
- ✅ @nestjs/passport
- ✅ passport
- ✅ passport-jwt
- ✅ @types/passport-jwt

**本 Story 无需新增依赖**

**JwtAuthGuard 实现**:
```typescript
// guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  // 自定义 401 响应消息
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new Error('未认证或 Token 已过期');
    }
    return user;
  }
}
```

**CurrentUser 装饰器实现**:
```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserData;
  },
);
```

**受保护路由示例** (创建测试端点):
```typescript
// users.controller.ts (新建或扩展)
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)  // 整个控制器都需要认证
export class UsersController {
  @Get('me')
  getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return {
      statusCode: 200,
      message: '获取当前用户信息成功',
      data: {
        id: user.userId,
        email: user.email,
      },
    };
  }
}
```

**公开路由装饰器** (可选，用于标记公开路由):
```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

//然后在 JwtAuthGuard 中检查:
//  const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
//  if (isPublic) return true;
```

**用户完整信息获取** (需要从数据库查询):
```typescript
// users.service.ts
async getUserById(userId: string) {
  const user = await this.prisma.client.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('用户不存在');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// users.controller.ts
@Get('me')
async getCurrentUser(@CurrentUser() user: CurrentUserData) {
  const fullUser = await this.usersService.getUserById(user.userId);
  return {
    statusCode: 200,
    message: '获取当前用户信息成功',
    data: fullUser,
  };
}
```

### File Structure Requirements

**目标文件结构**:
```
apps/api/src/
├── modules/
│   └── auth/
│       ├── auth.module.ts              # 需要更新 (导出 JwtAuthGuard)
│       ├── auth.controller.ts          # 已存在
│       ├── auth.service.ts             # 已存在
│       ├── guards/
│       │   └── jwt-auth.guard.ts       # 新增
│       ├── strategies/
│       │   └── jwt.strategy.ts         # 已存在 (Story 2.2)
│       └── dto/
│           ├── register.dto.ts         # 已存在
│           └── login.dto.ts            # 已存在
├── common/
│   └── decorators/
│       └── current-user.decorator.ts   # 新增
└── users/
    ├── users.module.ts                 # 新增 (测试 Guard 使用)
    ├── users.controller.ts             # 新增 (GET /me 端点)
    └── users.service.ts                # 新增 (查询用户逻辑)
```

### Project Structure Notes

**Monorepo 集成**:
1. Guard 使用 `@nestjs/passport` 的 AuthGuard 作为基类
2. 装饰器使用 NestJS 的 `createParamDecorator` 创建
3. 受保护路由使用 `@UseGuards()` 装饰器应用 Guard

**与后续 Story 的衔接**:
- **Story 2.4 (UI)**: 前端需要在请求头携带 `Authorization: Bearer ${accessToken}`
- **Story 2.5 (登出)**: 登出端点需要此 Guard 验证用户已登录
- **Story 2.6 (个人资料)**: PUT /api/v1/users 需要此 Guard
- **Epic 3 (视频管理)**: 所有视频 CRUD API 需要此 Guard

**Guard 使用模式**:
```typescript
// 控制器级别 (所有端点都需要认证)
@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  @Get()
  findAll() { ... }

  @Post()
  create() { ... }
}

// 端点级别 (特定端点需要认证)
@Controller('auth')
export class AuthController {
  @Post('login')  // 公开，不需要 Guard
  login() { ... }

  @Post('logout')
  @UseGuards(JwtAuthGuard)  // 需要认证
  logout() { ... }
}
```

### Common Pitfalls to Avoid

**❌ 错误做法:**

1. **忘记导出 Guard**
   - JwtAuthGuard 必须在 AuthModule 中导出，才能在其他模块使用

2. **装饰器返回类型不正确**
   - CurrentUser 装饰器必须返回正确的用户数据结构

3. **Guard 中自定义错误处理不当**
   - 应该抛出标准异常，而不是直接返回 false

4. **测试端点需要完整用户信息**
   - Token 中只有 userId 和 email，完整信息需要从数据库查询

5. **公开路由没有正确配置**
   - register 和 login 必须保持公开，不能应用 Guard

**✅ 正确做法:**

1. 在 AuthModule 中导出 JwtAuthGuard
2. 使用 TypeScript 接口定义 CurrentUserData 类型
3. 使用 UnauthorizedException 处理认证失败
4. 创建 UsersService 查询完整用户信息
5. 使用 @Public() 装饰器或不在公开路由应用 Guard

### Testing Requirements

**验证清单:**

1. **Guard 创建正确**
   - [ ] jwt-auth.guard.ts 已创建
   - [ ] current-user.decorator.ts 已创建
   - [ ] JwtAuthGuard 在 AuthModule 中导出

2. **认证功能验证**
   - [ ] 有效 Token 可以访问受保护路由
   - [ ] 无效 Token 返回 401
   - [ ] 缺失 Token 返回 401
   - [ ] 过期 Token 返回 401
   - [ ] 用户信息正确注入到 request.user

3. **公开路由验证**
   - [ ] POST /api/v1/auth/register 无需 Token 可访问
   - [ ] POST /api/v1/auth/login 无需 Token 可访问

4. **集成验证**
   - [ ] 后端正常启动无报错
   - [ ] GET /api/v1/users/me 端点可访问

**测试命令:**
```bash
# 1. 启动后端
pnpm --filter @bmad-starter-kit/api start:dev

# 2. 先登录获取 Token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}')

# 提取 accessToken (需要 jq 或手动提取)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# 3. 测试有效 Token 访问受保护路由 (应返回 200)
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"

# 4. 测试无效 Token (应返回 401)
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer invalid-token"

# 5. 测试缺失 Token (应返回 401)
curl -X GET http://localhost:3000/api/v1/users/me

# 6. 测试公开路由无需 Token
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Test1234","name":"测试"}'
```

### Git Intelligence

**最近相关提交:**
```
749b3db 完成 Story 2.2: 用户登录功能
4b4387f 完成 Story 2.1: 用户注册功能
4145107 完成 Epic 1: Story 1.5 Prisma 配置和 Epic 1 回顾
```

**本 Story 影响:**
- 新增 `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- 新增 `apps/api/src/common/decorators/current-user.decorator.ts`
- 新增 `apps/api/src/users/` 目录 (users.module.ts, users.controller.ts, users.service.ts)
- 修改 `apps/api/src/modules/auth/auth.module.ts` (导出 JwtAuthGuard)

### References

**架构文档引用:**
- 认证架构: [Source: docs/planning-artifacts/architecture.md#Authentication & Security]
- Guard 机制: [Source: docs/planning-artifacts/architecture.md#Guard 机制]
- 认证拦截器链: [Source: docs/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- HTTP 状态码: [Source: docs/planning-artifacts/architecture.md#Error Handling Standards]

**Epic 文档引用:**
- Story 2.3 完整定义: [Source: docs/planning-artifacts/epics.md#Story 2.3]
- Epic 2 总览: [Source: docs/planning-artifacts/epics.md#Epic 2]

**前序 Story 文档:**
- Story 2.2 实现: [Source: docs/implementation-artifacts/2-2-user-login.md]
- Story 2.1 实现: [Source: docs/implementation-artifacts/2-1-user-registration.md]

**NestJS 官方文档:**
- Guards: https://docs.nestjs.com/guards
- Custom Decorators: https://docs.nestjs.com/custom-decorators
- Passport: https://docs.nestjs.com/security/authentication#passport

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

No external debugging sessions were required during story creation.

### Completion Notes List

Story 实现完成，关键要点:

1. **基于 Story 2.2 的 JwtStrategy**: Guard 使用已配置的 Passport JWT 策略

2. **CurrentUser 装饰器**: 提供类型安全的用户信息访问方式

3. **测试端点 GET /api/v1/users/me**: 验证 Guard 工作正常

4. **公开路由保持可访问**: register 和 login 使用 @Public() 装饰器保持公开

5. **为后续 Story 准备**: 所有需要认证的 API 都可以使用此 Guard

**实现细节:**
- JwtAuthGuard 继承 AuthGuard('jwt') 并使用 Reflector 检查 @Public() 元数据
- CurrentUser 装饰器从 request.user 提取用户信息（由 JwtStrategy 注入）
- UsersModule 创建了 GET /api/v1/users/me 端点用于测试
- AuthModule 导出 JwtAuthGuard 供其他模块使用

**测试结果:**
- ✅ 有效 Token 可以访问受保护路由（返回 200）
- ✅ 无效 Token 返回 401
- ✅ 缺失 Token 返回 401
- ✅ 过期 Token 返回 401
- ✅ 公开路由（register/login）无需 Token 可访问
- ✅ 所有单元测试通过（92 passed）

**Code Review 修复 (实施后改进):**

1. **JWT 错误处理增强**: 为不同类型的 JWT 错误添加了具体的错误消息
   - TokenExpiredError → "Token 已过期"
   - JsonWebTokenError → "Token 格式错误"
   - NotBeforeError → "Token 尚未生效"
   - 其他情况 → "未认证或 Token 无效"

2. **@Public() 装饰器文档**: 在 AuthController 中添加了注释说明装饰器的预防性用途

3. **单元测试覆盖**: 为所有新增文件创建了完整的单元测试
   - jwt-auth.guard.spec.ts - 测试 handleRequest 的错误处理逻辑
   - current-user.decorator.spec.ts - 测试用户提取功能
   - public.decorator.spec.ts - 测试元数据设置
   - users.controller.spec.ts - 测试控制器端点
   - users.service.spec.ts - 测试服务层逻辑

### File List

**新增文件:**
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` - JWT 认证守卫
- `apps/api/src/common/decorators/current-user.decorator.ts` - 当前用户装饰器
- `apps/api/src/common/decorators/public.decorator.ts` - 公开路由装饰器
- `apps/api/src/common/decorators/index.ts` - 装饰器导出
- `apps/api/src/users/users.module.ts` - 用户模块
- `apps/api/src/users/users.controller.ts` - 用户控制器（GET /me 端点）
- `apps/api/src/users/users.service.ts` - 用户服务（查询用户逻辑）

**修改文件:**
- `apps/api/src/modules/auth/auth.module.ts` - 导出 JwtAuthGuard，添加到 providers
- `apps/api/src/modules/auth/auth.controller.ts` - 添加 @Public() 装饰器和文档注释
- `apps/api/src/app.module.ts` - 导入 UsersModule
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` - 增强错误处理，添加具体错误消息

**测试文件:**
- `apps/api/src/modules/auth/guards/jwt-auth.guard.spec.ts` - JWT 守卫单元测试
- `apps/api/src/common/decorators/current-user.decorator.spec.ts` - CurrentUser 装饰器测试
- `apps/api/src/common/decorators/public.decorator.spec.ts` - Public 装饰器测试
- `apps/api/src/users/users.controller.spec.ts` - 用户控制器测试
- `apps/api/src/users/users.service.spec.ts` - 用户服务测试

**文档更新:**
- `docs/implementation-artifacts/sprint-status.yaml` - 更新状态为 done
