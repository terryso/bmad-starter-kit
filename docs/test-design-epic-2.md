# Test Design: Epic 2 - 用户认证与账户管理

**Date:** 2026-01-17
**Author:** Nick
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 2

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (≥6): 5
- Critical categories: SEC (安全), BUS (业务影响)

**Coverage Summary:**

- P0 scenarios: 18 (36 hours)
- P1 scenarios: 22 (22 hours)
- P2/P3 scenarios: 15 (5 hours)
- **Total effort**: 55 scenarios, 63 hours (~8 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | SEC | JWT Secret 弱密钥或泄露导致 Token 伪造 | 2 | 3 | 6 | 生产环境强制强密钥，环境变量隔离 | DevOps | 2026-01-20 |
| R-002 | SEC | Refresh Token 在 Cookie 中被 XSS 窃取 | 2 | 3 | 6 | HttpOnly + Secure + SameSite 配置 | Dev | 2026-01-17 |
| R-004 | SEC | 登录/注册接口缺少速率限制被暴力破解 | 2 | 3 | 6 | @nestjs/throttler 5次/15分钟 | Dev | 2026-01-17 |
| R-005 | SEC | JWT Guard 未正确应用导致未授权访问 | 2 | 3 | 6 | 所有受保护路由应用 JwtAuthGuard | Dev | 2026-01-17 |
| R-007 | BUS | Token 过期后用户被强制登出影响体验 | 3 | 2 | 6 | Refresh Token 自动刷新机制 | Dev | 2026-01-20 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-006 | DATA | 用户注册时数据库操作失败导致数据不一致 | 2 | 2 | 4 | Prisma 事务处理 | Dev |
| R-008 | TECH | 重复邮箱注册未正确处理 | 2 | 2 | 4 | Prisma @unique 约束 + ConflictException | Dev |
| R-009 | PERF | bcrypt 密码验证在高并发下性能瓶颈 | 2 | 2 | 4 | 异步处理，考虑 future salt rounds 调整 | Dev |
| R-010 | OPS | JWT_SECRET 未设置导致服务启动失败 | 1 | 3 | 3 | 启动时验证环境变量 | DevOps |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------- |
| R-003 | SEC | 密码加密存储不正确导致用户数据泄露 | 1 | 3 | 3 | 代码审查 + 单元测试验证 |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ------------ | ---------- | --------- | ---------- | ----- | ----- |
| 用户注册成功 | API | R-008 | 3 | QA | 验证 201 响应，密码加密，用户创建 |
| 重复邮箱注册返回 409 | API | R-008 | 2 | QA | Prisma 唯一约束验证 |
| 注册输入验证 (邮箱格式、密码长度) | API | R-003 | 4 | QA | class-validator 规则验证 |
| 用户登录成功 | API | R-005 | 3 | QA | 返回 Access Token，设置 Cookie |
| 登录密码错误返回 401 | API | R-004 | 2 | QA | bcrypt.compare 验证 |
| JWT Guard 保护受保护路由 | API | R-005 | 4 | QA | 无 Token 返回 401，有效 Token 通过 |
| Access Token 过期返回 401 | API | R-007 | 2 | QA | 15 分钟过期验证 |
| Refresh Token 自动刷新 | E2E | R-007 | 3 | QA | Cookie 自动刷新流程 |
| 登出清除 Refresh Token Cookie | E2E | R-002 | 2 | QA | HttpOnly Cookie 清除验证 |
| 密码使用 bcrypt 加密 | Unit | R-003 | 2 | DEV | salt rounds = 10 验证 |
| 速率限制 (5次/15分钟) | API | R-004 | 3 | QA | @nestjs/throttler 验证 |
| JWT Secret 配置验证 | Unit | R-001 | 2 | DEV | 启动时强密钥验证 |
| Cookie 安全配置 (HttpOnly, Secure) | Unit | R-002 | 2 | DEV | Cookie 参数验证 |
| 未认证访问受保护路由 | E2E | R-005 | 3 | QA | 前端重定向验证 |
| 个人资料更新成功 | API | - | 2 | QA | PUT /api/v1/users 验证 |
| 邮箱字段不可修改 | API | - | 2 | QA | 邮箱只读验证 |
| Token 刷新后状态同步 | E2E | R-007 | 2 | QA | Zustand store 同步验证 |
| 登录/注册完整流程 | E2E | R-005, R-007 | 5 | QA | 端到端用户旅程验证 |

**Total P0**: 55 tests, 36 hours (2h/test for complex setup, security testing)

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ------------ | ---------- | --------- | ---------- | ----- | ----- |
| 注册错误处理 (网络错误、服务错误) | API | R-006 | 3 | QA | 异常场景验证 |
| 登录错误处理 (网络超时、服务错误) | API | R-006 | 3 | QA | 异常场景验证 |
| JWT Token Payload 结构验证 | Unit | R-005 | 2 | DEV | sub, email 字段验证 |
| Refresh Token 有效期 (7天) | API | R-007 | 2 | QA | Cookie maxAge 验证 |
| 用户信息获取 (GET /api/v1/users/me) | API | - | 2 | QA | 当前用户信息验证 |
| 个人资料姓名验证 (1-50字符) | API | - | 3 | QA | UpdateProfileDto 验证 |
| 登出后 Token 失效验证 | E2E | R-002 | 2 | QA | 登出后无法使用原 Token |
| 前端表单验证 (React Hook Form + Zod) | Component | - | 3 | DEV | 前端验证规则验证 |
| 前端认证状态管理 (Zustand) | Unit | - | 2 | DEV | auth store 状态验证 |
| 受保护路由前端守卫 | Component | R-005 | 2 | DEV | React Router 守卫验证 |
| Toast 错误提示显示 | Component | - | 2 | DEV | 用户反馈验证 |
| Loading 状态显示 | Component | - | 2 | DEV | 用户体验验证 |
| Header 用户信息显示 | Component | - | 1 | DEV | 用户名/邮箱显示验证 |
| 并发注册请求处理 | API | R-008 | 2 | QA | 竞态条件验证 |
| 登录后自动跳转仪表盘 | E2E | - | 1 | QA | 用户旅程验证 |
| 注册后自动登录 | E2E | - | 1 | QA | 用户旅程验证 |
| 个人资料更新后 Header 同步 | E2E | - | 1 | QA | 状态同步验证 |
| 空姓名处理 | API | - | 2 | QA | 可选字段验证 |
| 特殊字符输入验证 | API | - | 2 | QA | 输入清洗验证 |
| 响应格式统一验证 | API | - | 1 | QA | ApiResponse 格式验证 |
| CORS 配置验证 | API | - | 1 | QA | 跨域请求验证 |

**Total P1**: 42 tests, 22 hours (0.5h/test for standard scenarios)

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ------------ | ---------- | --------- | ---------- | ----- | ----- |
| 密码强度验证 (大小写+数字) | API | - | 3 | QA | 增强验证规则 |
| 最长密码输入处理 | API | - | 1 | QA | 边界测试 |
| 邮箱边界格式测试 | API | - | 3 | QA | RFC 5322 边界 |
| Unicode 姓名字符支持 | API | - | 2 | QA | 国际化支持 |
| 数据库连接失败处理 | API | R-006 | 1 | QA | 服务降级验证 |
| 环境变量默认值测试 | Unit | R-010 | 1 | DEV | 配置验证 |
| Token 提前过期测试 | API | R-007 | 1 | QA | 时间边界 |
| Cookie SameSite 策略测试 | API | R-002 | 1 | QA | CSRF 防护 |

**Total P2**: 13 tests, 4 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
| ------------ | ---------- | ---------- | ----- | ----- |
| bcrypt 性能基准测试 | Unit | 1 | DEV | salt rounds 性能对比 |
| 并发登录性能测试 | API | 1 | QA | 负载测试 |
| UI 响应式布局测试 | E2E | 1 | QA | 移动端验证 |
| 无障碍访问测试 (a11y) | E2E | 1 | QA | ARIA 标签验证 |

**Total P3**: 4 tests, 1 hour

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] 注册端点可访问 (30s)
- [ ] 登录端点可访问 (30s)
- [ ] JWT Guard 正常工作 (1min)
- [ ] 受保护路由需要认证 (30s)
- [ ] Cookie 设置正确 (30s)
- [ ] 环境变量已配置 (30s)

**Total**: 6 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] 用户注册成功流程 (E2E)
- [ ] 重复邮箱返回 409 (API)
- [ ] 用户登录成功 (API)
- [ ] JWT Token 验证 (API)
- [ ] Token 过期处理 (API)
- [ ] 登出清除 Cookie (E2E)
- [ ] 密码 bcrypt 加密 (Unit)
- [ ] 速率限制验证 (API)
- [ ] 受保护路由保护 (E2E)
- [ ] 完整认证旅程 (E2E)

**Total**: 18 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] 错误处理场景 (API)
- [ ] Token Payload 验证 (Unit)
- [ ] 个人资料 CRUD (API)
- [ ] 前端表单验证 (Component)
- [ ] 状态管理 (Unit)
- [ ] UI 组件测试 (Component)

**Total**: 42 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] 边界测试 (API)
- [ ] 国际化支持 (API)
- [ ] 性能测试 (Unit)
- [ ] UI 响应式 (E2E)

**Total**: 17 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| --------- | ----- | ---------- | ----------- | ----- |
| P0 | 55 | 2.0 | 36 | 复杂设置、安全测试 |
| P1 | 42 | 1.0 | 22 | 标准覆盖 |
| P2 | 13 | 0.5 | 4 | 简单场景 |
| P3 | 4 | 0.25 | 1 | 探索性、性能 |
| **Total** | **114** | **-** | **63** | **~8 days** |

### Prerequisites

**Test Data:**

- UserFactory (faker-based, auto-cleanup)
- TestUser fixture (setup/teardown)
- 测试邮箱和密码常量

**Tooling:**

- Jest (Unit 测试)
- Supertest (API 测试)
- Playwright (E2E 测试)
- faker.js (测试数据生成)

**Environment:**

- 测试数据库 (PostgreSQL)
- JWT_SECRET 测试配置
- CORS 测试配置

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80%
- **Security scenarios**: 100%
- **Business logic**: ≥70%
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] Security tests (SEC category) pass 100%
- [ ] Password encryption verified (bcrypt)
- [ ] JWT Guard applied to all protected routes

---

## Mitigation Plans

### R-001: JWT Secret 弱密钥或泄露 (Score: 6)

**Mitigation Strategy:**
- 生产环境强制要求强随机密钥 (≥32 字符)
- 使用环境变量隔离，禁止硬编码
- 服务启动时验证 JWT_SECRET 已设置且足够强
- 定期轮换密钥 (建议每 90 天)

**Owner:** DevOps
**Timeline:** 2026-01-20
**Status:** Planned
**Verification:** 单元测试验证启动时强密钥检查

### R-002: Refresh Token 在 Cookie 中被 XSS 窃取 (Score: 6)

**Mitigation Strategy:**
- HttpOnly: true (JavaScript 无法访问)
- Secure: true (生产环境仅 HTTPS)
- SameSite: lax (防止 CSRF)
- 路径限制: /

**Owner:** Dev
**Timeline:** 2026-01-17
**Status:** 已实现
**Verification:** Cookie 参数单元测试验证

### R-004: 登录/注册接口缺少速率限制 (Score: 6)

**Mitigation Strategy:**
- @nestjs/throttler 配置 5次/15分钟
- 分别应用于 register 和 login 端点
- 超限返回 429 Too Many Requests

**Owner:** Dev
**Timeline:** 2026-01-17
**Status:** 已实现
**Verification:** API 测试验证速率限制

### R-005: JWT Guard 未正确应用导致未授权访问 (Score: 6)

**Mitigation Strategy:**
- 所有受保护路由应用 @UseGuards(JwtAuthGuard)
- @Public() 装饰器标记公开路由
- 定期审查新增路由的 Guard 配置

**Owner:** Dev
**Timeline:** 2026-01-17
**Status:** 已实现
**Verification:** E2E 测试验证未授权访问返回 401

### R-007: Token 过期后用户被强制登出 (Score: 6)

**Mitigation Strategy:**
- 实现 Refresh Token 自动刷新机制
- Access Token 过期前 30 秒尝试刷新
- 刷新失败时引导用户重新登录

**Owner:** Dev
**Timeline:** 2026-01-20
**Status:** Planned
**Verification:** E2E 测试验证自动刷新流程

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 测试数据库已配置并可访问
2. JWT_SECRET 在测试环境中已设置
3. faker.js 用于生成测试数据
4. 现有单元测试框架 (Jest) 已配置

### Dependencies

1. **Playwright 安装** - E2E 测试框架 (2026-01-18)
2. **测试数据库** - 独立的 PostgreSQL 实例 (2026-01-17)
3. **faker.js** - 测试数据生成库 (2026-01-17)

### Risks to Plan

- **Risk**: E2E 测试环境可能不稳定
  - **Impact**: 测试执行时间增加
  - **Contingency**: 使用 API 测试替代部分 E2E 场景

- **Risk**: bcrypt 测试可能较慢
  - **Impact**: 单元测试执行时间增加
  - **Contingency**: Mock bcrypt compare/hash 用于非安全测试

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation exists.
- Run `*ci` to configure pipeline stages with test execution.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: docs/planning-artifacts/prd.md
- Epic: docs/planning-artifacts/epics.md (Epic 2)
- Architecture: docs/planning-artifacts/architecture.md
- Stories: docs/implementation-artifacts/2-*.md

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
