/**
 * 选择器辅助函数
 *
 * 提供类型安全的选择器定义
 * 推荐使用 data-testid 属性作为主要选择策略
 */

/**
 * 选择器命名空间
 *
 * 按页面/功能组织选择器，便于维护
 */
export const selectors = {
  // 认证相关
  auth: {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    logoutButton: '[data-testid="logout-button"]',
    registerLink: '[data-testid="register-link"]',
    errorMessage: '[data-testid="auth-error"]',
  },

  // 通用 UI
  common: {
    submitButton: '[data-testid="submit-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    closeButton: '[data-testid="close-button"]',
    loadingSpinner: '[data-testid="loading"]',
    toast: '[data-testid="toast"]',
  },

  // 导航
  nav: {
    mainMenu: '[data-testid="main-menu"]',
    userMenu: '[data-testid="user-menu"]',
    homeLink: '[data-testid="nav-home"]',
    dashboardLink: '[data-testid="nav-dashboard"]',
  },

  // 用户相关
  user: {
    profileButton: '[data-testid="user-profile"]',
    userName: '[data-testid="user-name"]',
    userAvatar: '[data-testid="user-avatar"]',
  },

  // 表单
  form: {
    input: (name: string) => `[data-testid="${name}-input"]`,
    select: (name: string) => `[data-testid="${name}-select"]`,
    checkbox: (name: string) => `[data-testid="${name}-checkbox"]`,
    error: (name: string) => `[data-testid="${name}-error"]`,
  },
} as const;

/**
 * 获取页面标题选择器
 */
export const getPageTitleSelector = () => 'head > title';

/**
 * 获取页面描述选择器
 */
export const getPageDescriptionSelector = () => 'head > meta[name="description"]';
