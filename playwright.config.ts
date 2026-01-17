import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 *
 * 测试超时配置:
 * - actionTimeout: 15s (操作超时)
 * - navigationTimeout: 30s (导航超时)
 * - timeout: 60s (测试超时)
 * - expect.timeout: 15s (断言超时)
 *
 * 失败时捕获:
 * - screenshot: 'only-on-failure'
 * - video: 'retain-on-failure'
 * - trace: 'retain-on-failure'
 */
export default defineConfig({
  // 测试文件目录
  testDir: './tests/e2e',

  // 完全并行执行测试 (提升性能)
  fullyParallel: true,

  // CI 环境下禁止使用 test.only
  forbidOnly: !!process.env.CI,

  // 重试次数 (CI 环境: 2次, 本地: 不重试)
  retries: process.env.CI ? 2 : 0,

  // Worker 数量 (CI 环境: 1, 本地: 自动)
  workers: process.env.CI ? 1 : undefined,

  // 测试超时配置
  timeout: 60 * 1000, // 60秒
  expect: {
    timeout: 15 * 1000, // 15秒
  },

  // 测试环境配置
  use: {
    // 基础 URL (通过环境变量配置)
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // 失败时保留追踪信息 (用于调试)
    trace: 'retain-on-failure',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时保留视频
    video: 'retain-on-failure',

    // 操作超时
    actionTimeout: 15 * 1000, // 15秒

    // 导航超时
    navigationTimeout: 30 * 1000, // 30秒
  },

  // 测试报告配置
  reporter: [
    // HTML 报告 (交互式查看)
    ['html', { outputFolder: 'playwright-report' }],
    // JUnit XML 报告 (CI 集成)
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // 控制台列表输出
    ['list'],
  ],

  // 测试项目配置 (多浏览器支持)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // 开发服务器配置 (可选)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
