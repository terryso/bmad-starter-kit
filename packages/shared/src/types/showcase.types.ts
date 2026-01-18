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
