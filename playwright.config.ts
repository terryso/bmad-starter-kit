import { defineConfig, devices } from '@playwright/test';

// Use environment variables or defaults
const API_URL = process.env.API_URL || 'http://localhost:3000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

/**
 * Playwright 配置文件
 *
 * 测试分层结构:
 * - API 测试: tests/api/ - 不需要浏览器，快速执行
 * - E2E 测试: tests/e2e/ - 需要浏览器，测试用户交互
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
 *
 * 运行方式:
 * - 全部测试: npx playwright test
 * - 仅 API: npx playwright test --project=api
 * - 仅 UI (chromium): npx playwright test --project=chromium-ui
 */
export default defineConfig({
  // 默认测试目录 (向后兼容)
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
  timeout: 120 * 1000, // 120秒 (API 测试可能需要更长时间)
  expect: {
    timeout: 30 * 1000, // 30秒
  },

  // 测试环境默认配置
  use: {
    // 失败时保留追踪信息 (用于调试)
    trace: 'retain-on-failure',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时保留视频
    video: 'retain-on-failure',

    // 操作超时 - API 测试可能需要更长时间
    actionTimeout: 60 * 1000, // 60秒

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

  // 测试项目配置
  projects: [
    // API 测试 - 不需要浏览器，快速执行
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        // API 测试不需要 baseURL
        // 所有 API URL 通过环境变量 API_URL 配置
      },
      // API 测试可以更高并发
      fullyParallel: true,
    },

    // UI 测试 - 需要浏览器
    {
      name: 'chromium-ui',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
      },
    },

    // 多浏览器兼容性测试 (可选，CI 时可跳过以节省时间)
    {
      name: 'firefox-ui',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: BASE_URL,
      },
    },

    {
      name: 'webkit-ui',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Safari'],
        baseURL: BASE_URL,
      },
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
