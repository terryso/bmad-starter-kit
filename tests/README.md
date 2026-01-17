# Test Suite Documentation

## Overview

This project has comprehensive test coverage across both API (NestJS) and Web (React/Vite) applications.

**Test Frameworks:**
- **API**: Jest with NestJS TestingModule
- **Web**: Vitest with React Testing Library

## Test Structure

### API Tests (apps/api/)

Located in `apps/api/src/` alongside source files.

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.spec.ts      # Auth controller tests
│   │   ├── auth.service.spec.ts         # Auth service tests
│   │   ├── dto/
│   │   │   ├── login.dto.spec.ts        # Login DTO validation tests
│   │   │   └── register.dto.spec.ts     # Register DTO validation tests
│   │   └── guards/
│   │       ├── jwt-auth.guard.spec.ts   # JWT guard tests
│   │       └── roles.guard.spec.ts      # Roles guard tests
│   └── admin/
│       ├── admin.controller.spec.ts     # Admin controller tests
│       └── admin.service.spec.ts        # Admin service tests
├── test-helpers/
│   ├── factories/                       # Data factories
│   │   └── user.factory.ts              # User test data generation
│   ├── fixtures/                        # Test fixtures
│   │   └── api-integration.fixture.ts   # Integration test setup
│   └── integration/
│       └── auth-api.integration.spec.ts # Auth API integration tests
└── users/
    ├── users.controller.spec.ts         # Users controller tests
    └── users.service.spec.ts            # Users service tests
```

### Web Tests (apps/web/)

Located in `apps/web/src/` alongside source files.

```
apps/web/src/
├── components/
│   ├── auth/
│   │   └── AuthProvider.test.tsx        # Auth provider component tests
│   ├── features/
│   │   └── auth/
│   │       ├── LoginForm.test.tsx       # Login form component tests
│   │       └── RegisterForm.test.tsx    # Register form component tests
│   └── routes/
│       └── ProtectedRoute.test.tsx      # Protected route component tests
├── stores/
│   └── auth.store.test.ts               # Auth store unit tests
└── lib/
    └── api.test.ts                      # API client unit tests
```

## Running Tests

### API Tests

```bash
# Run all API tests
cd apps/api && pnpm test

# Run tests in watch mode
cd apps/api && pnpm test:watch

# Run tests with coverage
cd apps/api && pnpm test:cov

# Run e2e tests
cd apps/api && pnpm test:e2e
```

### Web Tests

```bash
# Run all web tests
cd apps/web && pnpm test

# Run tests in watch mode
cd apps/web && pnpm test:run -- --watch

# Run tests with coverage
cd apps/web && pnpm test:coverage

# Run tests with UI
cd apps/web && pnpm test:ui
```

## Test Levels

### Unit Tests

**Purpose**: Test isolated functions and classes

**Characteristics**:
- Fast execution
- No external dependencies
- Test business logic in isolation

**Examples**:
- DTO validation tests
- Service method tests
- Store unit tests
- Utility function tests

### Integration Tests

**Purpose**: Test component interactions and API contracts

**Characteristics**:
- Test multiple components together
- May use test databases
- Validate service boundaries

**Examples**:
- API endpoint tests
- Controller + Service integration
- API client tests

### Component Tests

**Purpose**: Test React components in isolation

**Characteristics**:
- Test user interactions
- Validate component state
- Mock external dependencies

**Examples**:
- LoginForm tests
- RegisterForm tests
- ProtectedRoute tests

## Priority Tags

Tests are tagged with priority levels for selective execution:

| Priority | Description | Examples |
|----------|-------------|----------|
| **P0** | Critical paths, security, data integrity | Login flow, token refresh, auth guards |
| **P1** | High value, frequently used | Form validation, error handling |
| **P2** | Medium priority, edge cases | Loading states, fallback content |
| **P3** | Low priority, nice to have | Optional features |

## Test Fixtures and Factories

### User Factory

Generate test user data with random values:

```typescript
import { createUser, createUsers, generateEmail, generatePassword } from '@/test-helpers/factories/user.factory';

// Create single user
const user = createUser({ email: 'test@example.com' });

// Create multiple users
const users = createUsers(5);

// Generate random data
const email = generateEmail();
const password = generatePassword();
```

### API Integration Fixture

Set up full NestJS testing module:

```typescript
import { ApiIntegrationFixture } from '@/test-helpers/fixtures/api-integration.fixture';

describe('My Tests', () => {
  let fixture: ApiIntegrationFixture;

  beforeAll(async () => {
    fixture = new ApiIntegrationFixture();
    await fixture.create();
  });

  afterAll(async () => {
    await fixture.cleanup();
  });
});
```

## Best Practices

### Given-When-Then Structure

All tests should follow this pattern:

```typescript
it('should do something when condition is met', async () => {
  // GIVEN: Setup test conditions
  const testData = createTestData();

  // WHEN: Execute the action
  const result = await executeAction(testData);

  // THEN: Verify the outcome
  expect(result).toBe(expectedValue);
});
```

### Test Naming

- Use descriptive names that explain what is being tested
- Include the expected outcome
- For user-facing features, use user-centric language

**Good examples**:
- `should login with valid credentials`
- `should show error for invalid email format`
- `should redirect unauthenticated users to login`

### Avoid Common Pitfalls

- ❌ Testing implementation details
- ❌ Hardcoded test data (use factories)
- ❌ Brittle selectors (use data-testid)
- ❌ Shared state between tests
- ❌ Conditional test logic

- ✅ Testing user behavior
- ✅ Random test data generation
- ✅ Stable, semantic selectors
- ✅ Isolated, independent tests
- ✅ Deterministic test flow

## Coverage Targets

| Test Type | Target Coverage |
|-----------|-----------------|
| Unit (Critical) | >90% |
| Unit (General) | >80% |
| Integration | >60% |
| E2E | Critical paths only |

## Troubleshooting

### Tests Failing with localStorage Errors

The test setup includes mocks for localStorage. Ensure `test-setup.ts` is imported in your test files or configured in vitest.config.ts.

### MSW (Mock Service Worker) Issues

For component tests that make API calls, ensure the mock server is set up:

```typescript
import { setupMockServer } from '@/test/mocks/server';

setupMockServer();
```

### Hydration Timing Issues

For tests involving auth state hydration, use waitFor or increase timeout:

```typescript
await waitFor(() => {
  expect(useAuthStore.getState()._hasHydrated).toBe(true);
}, { timeout: 500 });
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
