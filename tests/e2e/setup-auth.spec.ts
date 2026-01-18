/**
 * E2E 测试认证设置
 *
 * 运行此测试以创建认证文件，供其他 E2E 测试使用
 *
 * 运行方式:
 *   pnpm exec playwright test tests/e2e/setup-auth.spec.ts --project=chromium-ui
 */
import { test as setup } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

setup('authenticate for E2E tests', async ({ page }) => {
  console.log('🔐 Setting up E2E test authentication...');

  // 创建测试用户数据
  const timestamp = Date.now();
  const testUser = {
    email: `e2e-test-${timestamp}@example.com`,
    password: 'Test123456',
    name: `E2E Test ${timestamp}`,
  };

  console.log(`📝 Registering test user: ${testUser.email}`);

  // 注册用户
  const registerResponse = await page.request.post(`${API_URL}/api/v1/auth/register`, {
    data: testUser,
  });

  if (registerResponse.status() === 201) {
    console.log('✅ User registered successfully');
  } else if (registerResponse.status() === 409) {
    console.log('ℹ️  User already exists, proceeding with login');
  } else {
    const errorText = await registerResponse.text();
    console.error(`❌ Registration failed: ${errorText}`);
    // 继续尝试登录
  }

  // 通过页面登录
  console.log('🔑 Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', testUser.email);
  await page.fill('input[name="password"], input[type="password"]', testUser.password);
  await page.click('button[type="submit"]');

  // 等待登录成功
  await page.waitForURL(/\/(showcase|my-projects|\?|$)/, { timeout: 10000 });
  console.log('✅ Login successful');

  // 保存认证状态
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  console.log('💾 Auth state saved to playwright/.auth/user.json');
});
