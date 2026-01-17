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
