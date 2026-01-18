/**
 * E2E 测试全局设置
 *
 * 用于创建认证状态文件，供需要登录的 E2E 测试使用
 *
 * 运行方式:
 *   pnpm exec playwright test --config=playwright.config.ts -g "global-setup"
 */
import { chromium, FullConfig } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

async function globalSetup(config: FullConfig) {
  console.log('🔐 Setting up E2E test authentication...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: BASE_URL,
  });

  const page = await context.newPage();

  // 创建测试用户数据
  const timestamp = Date.now();
  const testUser = {
    email: `e2e-test-${timestamp}@example.com`,
    password: 'Test123456',
    name: `E2E Test User ${timestamp}`,
  };

  try {
    console.log(`📝 Registering test user: ${testUser.email}`);

    // 先注册用户
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
      throw new Error(`Failed to register user: ${errorText}`);
    }

    // 登录获取 token
    console.log('🔑 Logging in...');

    // 通过页面登录
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', testUser.email);
    await page.fill('input[name="password"], input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 等待登录成功 - 等待跳转或成功提示
    await page.waitForURL(/\/(showcase|my-projects|\?|$)/, { timeout: 10000 });
    console.log('✅ Login successful');

    // 保存认证状态
    await context.storageState({ path: 'playwright/.auth/user.json' });
    console.log('💾 Auth state saved to playwright/.auth/user.json');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✨ E2E test authentication setup complete!');
}

export default globalSetup;
