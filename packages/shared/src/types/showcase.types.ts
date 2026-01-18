/**
 * Showcase types
 * Project category and status enums
 */
export type ProjectCategory =
  | 'WEB_APP'
  | 'CLI'
  | 'LIBRARY'
  | 'API'
  | 'MOBILE'
  | 'OTHER';

export interface Project {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  forks: number | null;
  issues: number | null;
  language: string | null;
  topics: string[];
  category: ProjectCategory;
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  createdAt: string;
  githubUpdatedAt: string | null;
}

export interface ProjectsListResponse {
  items: Project[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface GetProjectsParams {
  page?: number;
  pageSize?: number;
  category?: ProjectCategory;
  language?: string;
  search?: string;
  sort?: 'latest' | 'stars' | 'recentlyAdded';
}

/**
 * 项目详情接口
 */
export interface ProjectDetail {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  forks: number | null;
  issues: number | null;
  language: string | null;
  topics: string[];
  category: ProjectCategory;
  suggestedTags: string[];
  screenshotUrl: string | null;
  homepageUrl: string | null;
  license: string | null;
  githubUrl: string;
  createdAt: string;
  githubUpdatedAt: string | null;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  reviewedAt: string | null;
}

/**
 * 相关项目接口
 */
export interface RelatedProject {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  category: ProjectCategory;
  screenshotUrl: string | null;
}

export interface RelatedProjectsResponse {
  items: RelatedProject[];
}

/**
 * 待审核项目接口 (管理员审核)
 */
export interface PendingProject {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  category: ProjectCategory;
  topics: string[];
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

/**
 * 待审核项目列表响应
 */
export interface PendingProjectsListResponse {
  items: PendingProject[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 项目状态枚举
 */
export type ProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 我的项目接口
 */
export interface MyProject {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  topics: string[];
  category: ProjectCategory;
  suggestedTags: string[];
  screenshotUrl: string | null;
  githubUrl: string;
  status: ProjectStatus;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

/**
 * 我的项目列表响应
 */
export interface MyProjectsListResponse {
  items: MyProject[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 我的项目查询参数
 */
export interface GetMyProjectsParams {
  page?: number;
  pageSize?: number;
  status?: ProjectStatus;
}
