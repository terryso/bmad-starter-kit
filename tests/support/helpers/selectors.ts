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

  // 管理员审核
  adminReview: {
    pendingProjectCard: '[data-testid="pending-project-card"]',
    approveButton: '[data-testid="approve-button"]',
    rejectButton: '[data-testid="reject-button"]',
    approveDialog: '[data-testid="approve-dialog"]',
    rejectDialog: '[data-testid="reject-dialog"]',
    rejectReasonInput: '[data-testid="reject-reason-input"]',
    confirmApproveButton: '[data-testid="confirm-approve-button"]',
    confirmRejectButton: '[data-testid="confirm-reject-button"]',
    pendingCountBadge: '[data-testid="pending-count-badge"]',
  },

  // 项目展示
  showcase: {
    projectGrid: '[data-testid="project-grid"]',
    projectCard: '[data-testid="project-card"]',
    projectTitle: '[data-testid="project-title"]',
    projectDescription: '[data-testid="project-description"]',
    projectStars: '[data-testid="project-stars"]',
    projectLanguage: '[data-testid="project-language"]',
    submitProjectButton: '[data-testid="submit-project-button"]',
    submitProjectDialog: '[data-testid="submit-project-dialog"]',
    githubUrlInput: '[data-testid="github-url-input"]',
    submitButton: '[data-testid="submit-button"]',
    filtersButton: '[data-testid="filters-button"]',
    filtersDialog: '[data-testid="filters-dialog"]',
  },

  // 项目详情
  projectDetail: {
    header: '[data-testid="project-detail-header"]',
    title: '[data-testid="project-title"]',
    description: '[data-testid="project-description"]',
    stats: '[data-testid="project-stats"]',
    stars: '[data-testid="project-stars"]',
    forks: '[data-testid="project-forks"]',
    openIssues: '[data-testid="project-open-issues"]',
    tags: '[data-testid="project-tags"]',
    topics: '[data-testid="project-topics"]',
    syncButton: '[data-testid="sync-project-button"]',
    deleteButton: '[data-testid="delete-project-button"]',
    relatedProjects: '[data-testid="related-projects"]',
    relatedProjectCard: '[data-testid="related-project-card"]',
    backButton: '[data-testid="back-button"]',
    githubLink: '[data-testid="github-link"]',
  },

  // 我的项目
  myProjects: {
    list: '[data-testid="my-projects-list"]',
    projectItem: '[data-testid="my-project-item"]',
    projectStatus: '[data-testid="project-status"]',
    statusPending: '[data-testid="status-pending"]',
    statusApproved: '[data-testid="status-approved"]',
    statusRejected: '[data-testid="status-rejected"]',
    emptyState: '[data-testid="empty-state"]',
    deleteButton: '[data-testid="delete-project-button"]',
    deleteConfirmDialog: '[data-testid="delete-confirm-dialog"]',
    confirmDeleteButton: '[data-testid="confirm-delete-button"]',
  },

  // 同步项目
  syncProject: {
    button: '[data-testid="sync-project-button"]',
    syncing: '[data-testid="syncing"]',
    lastSyncedAt: '[data-testid="last-synced-at"]',
    syncStatus: '[data-testid="sync-status"]',
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
