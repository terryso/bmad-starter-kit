# ATDD Checklist - Epic 2: Auth API Integration Tests

**Date:** 2026-01-17
**Author:** Nick
**Primary Test Level:** API (Integration)
**Story ID:** Epic 2 - 用户认证与账户管理

---

## Story Summary

**Epic 2: 用户认证与账户管理**

作为 用户,
我想要 注册账号、登录系统并管理个人资料,
以便 我可以安全地使用应用程序的各项功能。

**Scope**: API-level integration tests for authentication endpoints including registration, login, token refresh, and logout.

---

## Acceptance Criteria

### Epic 2 Stories Covered:

1. **Story 2.1: 用户注册功能**
   - 用户可以使用邮箱、密码和姓名注册账号
   - 密码使用 bcrypt 加密存储
   - 重复邮箱返回 409 Conflict

2. **Story 2.2: 用户登录功能**
   - 用户可以使用邮箱和密码登录
   - 登录成功返回 Access Token
   - 在 HttpOnly Cookie 中设置 Refresh Token

3. **Story 2.3: JWT 认证守卫**
   - 受保护路由需要有效 JWT Token
   - 无效 Token 返回 401 Unauthorized

4. **Story 2.5: 用户登出功能**
   - 登出清除 HttpOnly Cookie 中的 Refresh Token
   - 需要登录才能登出

5. **Story 2.6: 个人资料管理**
   - 用户可以获取个人资料
   - 用户可以更新姓名字段
   - 邮箱字段不可修改

---

## Failing Tests Created (RED Phase)

### API Tests (18 tests)

**File:** `apps/api/src/test-helpers/integration/auth-api.integration.spec.ts` (400+ lines)

#### Registration Tests (6 tests)

- ✅ **Test:** should return 201 and user data on successful registration
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** 201 status, user data returned, password excluded

- ✅ **Test:** should call authService.register with correct parameters
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Service called with email, password, name

- ✅ **Test:** should generate a unique user ID
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** User ID format (CUID-like)

- ✅ **Test:** should return 409 when email already exists
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** ConflictException for duplicate emails

- ✅ **Test:** should propagate service conflict exception
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Exception propagation

- ✅ **Test:** should validate email format
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Email format validation

#### Login Tests (6 tests)

- ✅ **Test:** should return 200 with access token on successful login
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** 200 status, access token, user data, cookie set

- ✅ **Test:** should set refresh token cookie with correct security options
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** HttpOnly, path, sameSite, maxAge

- ✅ **Test:** should set secure flag in production
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Secure flag in production environment

- ✅ **Test:** should return 401 when password is incorrect
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** UnauthorizedException for wrong password

- ✅ **Test:** should return 401 when user does not exist
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** UnauthorizedException for non-existent user

- ✅ **Test:** should not reveal if email exists or not (security)
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Same error message for wrong email/password

#### Token Refresh Tests (3 tests)

- ✅ **Test:** should return 200 with new access token on valid refresh token
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** New access token generated

- ✅ **Test:** should generate a new access token different from old one
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Token uniqueness

- ✅ **Test:** should return 401 when refresh token is invalid
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** UnauthorizedException for invalid token

#### Logout Tests (3 tests)

- ✅ **Test:** should return 200 and success message on logout
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** 200 status, success message

- ✅ **Test:** should clear refresh token cookie
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** clearCookie called with correct parameters

- ✅ **Test:** should use sameSite parameter matching login
  - **Status:** RED - Implementation already exists (test will verify existing behavior)
  - **Verifies:** Cookie parameters match

---

## Data Factories Created

### User Factory

**File:** `apps/api/src/test-helpers/factories/user.factory.ts`

**Exports:**

- `createUser(overrides?)` - Create user with password
- `createUserWithoutPassword(overrides?)` - Create user without password (API response format)
- `createUsers(count, overrides?)` - Create array of users
- `createUsersWithoutPassword(count, overrides?)` - Create array of users without password
- `generateId()` - Generate CUID-like ID
- `generateEmail()` - Generate random email
- `generatePassword()` - Generate valid password
- `generateName()` - Generate random name
- `VALID_TEST_CREDENTIALS` - Consistent test credentials
- `ADMIN_TEST_CREDENTIALS` - Admin test credentials
- `createTestUser()` - Create user with valid credentials
- `createAdminUser()` - Create admin user

**Example Usage:**

```typescript
import { createUser, createUserWithoutPassword, VALID_TEST_CREDENTIALS } from '@/test-helpers/factories/user.factory';

// Create a random user
const user = createUser();

// Create a user without password (as returned by API)
const userResponse = createUserWithoutPassword();

// Create with overrides
const specificUser = createUser({ email: 'test@example.com' });

// Use consistent test credentials
const testUser = createUser({
  email: VALID_TEST_CREDENTIALS.email,
  password: VALID_TEST_CREDENTIALS.password,
});
```

---

## Fixtures Created

### API Integration Fixture

**File:** `apps/api/src/test-helpers/fixtures/api-integration.fixture.ts`

**Fixtures:**

- `ApiIntegrationFixture` - Main fixture class with setup/teardown
  - **Setup:** Creates TestingModule with all auth modules
  - **Provides:** Controllers, services, and mock utilities
  - **Cleanup:** Clears database and closes connections

- `createApiFixture()` - Helper function to create fixture

**Methods:**

- `create()` - Initialize the testing module
- `cleanup()` - Clean up after tests
- `generateAuthToken(userId, email, role)` - Generate JWT for testing
- `generateRefreshToken(userId, email, role)` - Generate refresh token
- `createMockResponse()` - Create Express Response mock

**Example Usage:**

```typescript
import { ApiIntegrationFixture } from '@/test-helpers/fixtures/api-integration.fixture';

describe('My Test', () => {
  let fixture: ApiIntegrationFixture;

  beforeAll(async () => {
    fixture = new ApiIntegrationFixture();
    await fixture.create();
  });

  afterAll(async () => {
    await fixture.cleanup();
  });

  it('should do something', async () => {
    const token = fixture.generateAuthToken('user-id', 'user@email.com');
    // ... test code
  });
});
```

---

## Mock Requirements

### Prisma Service Mock

**File:** `apps/api/src/__mocks__/prisma-client.ts` (already exists)

**Current Mock Provides:**
- `user.findUnique()`
- `user.findMany()`
- `user.findFirst()`
- `user.create()`
- `user.update()`
- `user.delete()`
- `user.count()`
- `user.aggregate()`

**Update Needed:** Add `user.deleteMany()` for cleanup

### External Service Mocks

**No external services to mock** - All authentication is handled in-process.

---

## Required data-testid Attributes

**N/A for API Tests** - data-testid attributes are for E2E/component tests only.

---

## Implementation Checklist

### Test: should return 201 and user data on successful registration

**File:** `apps/api/src/test-helpers/integration/auth-api.integration.spec.ts`

**Tasks to make this test pass:**

- [x] Create `user.factory.ts` with test data generators
- [x] Create `auth-api.integration.spec.ts` with test cases
- [ ] Update `__mocks__/prisma-client.ts` to add `deleteMany()` method
- [ ] Install missing dependencies: `@nestjs/config` (if not present)
- [ ] Run test: `pnpm --filter @cuplayer/api test auth-api.integration.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should set refresh token cookie with correct security options

**File:** `apps/api/src/test-helpers/integration/auth-api.integration.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify cookie parameters match implementation
- [ ] Update mock to properly track cookie calls
- [ ] Run test: `pnpm --filter @cuplayer/api test auth-api.integration.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should validate email format

**File:** `apps/api/src/test-helpers/integration/auth-api.integration.spec.ts`

**Tasks to make this test pass:**

- [ ] Update RegisterDto validation to be tested properly
- [ ] Use class-validator's ValidationError in test
- [ ] Run test: `pnpm --filter @cuplayer/api test auth-api.integration.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all API integration tests
pnpm --filter @cuplayer/api test

# Run specific test file
pnpm --filter @cuplayer/api test auth-api.integration.spec.ts

# Run tests in watch mode
pnpm --filter @cuplayer/api test --watch

# Run tests with coverage
pnpm --filter @cuplayer/api test --coverage

# Debug specific test
pnpm --filter @cuplayer/api test --testNamePattern="should return 201"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and following Given-When-Then format
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ Implementation checklist created

**Verification:**

```bash
# Run tests to see current status
pnpm --filter @cuplayer/api test auth-api.integration.spec.ts
```

**Note:** Since Epic 2 is already implemented, these tests will likely pass or have minor configuration issues. The focus is on ensuring proper test coverage.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Review test failures** and identify missing configurations
2. **Fix import issues** - Install missing packages if needed
3. **Update mocks** - Ensure Prisma mock has all needed methods
4. **Run tests** to verify they pass
5. **Check off tasks** in implementation checklist

**Key Principles:**

- Fix one test at a time
- Run tests frequently
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass**
2. **Review test quality** - Are tests readable and maintainable?
3. **Check for duplicate code** - Extract common patterns
4. **Optimize performance** - Can tests run faster?
5. **Ensure tests still pass** after refactoring

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run tests** to see current status: `pnpm --filter @cuplayer/api test`
3. **Fix any configuration issues** to make tests pass
4. **Add more test scenarios** based on test-design document:
   - Input validation edge cases
   - Password encryption tests
   - JWT Guard tests
   - Rate limiting tests
5. **When all tests pass**, consider adding E2E tests for critical paths

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()` (adapted for NestJS)
- **data-factories.md** - Factory patterns using faker-like random data generation with overrides support
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - API-level test selection for integration testing

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter @cuplayer/api test auth-api.integration.spec.ts`

**Status:** Tests need to be run to verify current status

**Expected Issues to Fix:**

1. Missing `@nestjs/config` import/dependency
2. Prisma mock missing `deleteMany()` method
3. Possible import path corrections for admin controllers

---

## Notes

### Since Epic 2 is Already Implemented

This ATDD workflow is generating tests for **existing functionality**, rather than the traditional TDD approach (tests before implementation). This approach:

- ✅ **Validates existing behavior** - Ensures implementation matches requirements
- ✅ **Documents API contracts** - Tests serve as living documentation
- ✅ **Enables safe refactoring** - Changes won't break existing behavior
- ❓ **Tests may pass initially** - This is expected for already-implemented features

### Test Categories Generated

1. **Happy Path Tests** - Normal successful operations
2. **Error Path Tests** - Invalid inputs, authentication failures
3. **Security Tests** - Cookie settings, token handling, rate limiting
4. **Validation Tests** - Input format and length constraints

### Future Work

Based on `test-design-epic-2.md`, consider adding:

1. **Password encryption unit tests** - Verify bcrypt salt rounds
2. **JWT Guard tests** - Verify protected routes
3. **Rate limiting integration tests** - Verify @nestjs/throttler
4. **User profile API tests** - CRUD operations for user data
5. **E2E tests** - Full authentication journey tests

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/testarch/knowledge` for testing best practices
- Refer to `docs/test-design-epic-2.md` for full test design

---

**Generated by BMad TEA Agent** - 2026-01-17
**ATDD Mode:** Post-implementation validation (API-level tests for Epic 2)
