import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubFetcherService } from './github-fetcher.service';

// Define enum types locally to avoid Prisma import issues
// These match the Prisma schema values
export enum ProjectStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProjectCategory {
  WEB_APP = 'WEB_APP',
  CLI = 'CLI',
  LIBRARY = 'LIBRARY',
  API = 'API',
  MOBILE = 'MOBILE',
  OTHER = 'OTHER',
}

/**
 * Project database model type (from Prisma schema)
 */
export interface Project {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  language: string | null;
  topics: string[];
  githubUpdatedAt: Date | null;
  homepageUrl: string | null;
  license: string | null;
  githubUrl: string;
  category: ProjectCategory;
  suggestedTags: string[];
  screenshotUrl: string | null;
  status: ProjectStatus;
  submittedBy: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}

/**
 * Response data after project submission
 * Excludes sensitive fields like submittedBy, reviewedBy, etc.
 */
export interface ProjectPreview extends Omit<
  Project,
  'submittedBy' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason'
> {}

/**
 * Response interface for getProjects
 */
export interface ProjectsListResponse {
  items: ProjectPreview[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

@Injectable()
export class ShowcaseService {
  private readonly logger = new Logger(ShowcaseService.name);

  // Type assertion for Prisma project model (will be available after prisma generate)
  private readonly prismaProject: any;

  constructor(
    private prisma: PrismaService,
    private githubFetcher: GithubFetcherService,
  ) {
    this.prismaProject = (this.prisma as any).project;
  }

  /**
   * Submit a GitHub project for review
   * @param githubUrl GitHub repository URL
   * @param userId Current user ID from JWT
   * @returns Created project with PENDING status
   * @throws ConflictException if project already exists
   */
  async submitProject(
    githubUrl: string,
    userId: string,
  ): Promise<ProjectPreview> {
    this.logger.log(`User ${userId} submitting project: ${githubUrl}`);

    // 1. Check if project already exists
    const existingProject = await this.prismaProject.findUnique({
      where: { githubUrl },
    });

    if (existingProject) {
      this.logger.warn(`Project already exists: ${githubUrl}`);
      throw new ConflictException(
        '该项目已被提交，请勿重复提交'
      );
    }

    // 2. Fetch project info from GitHub using Agent SDK
    const projectInfo = await this.githubFetcher.fetchProjectInfo(githubUrl);

    // 3. Create project record in database
    const project = await this.prismaProject.create({
      data: {
        // GitHub info from Agent SDK
        repositoryName: projectInfo.repositoryName,
        description: projectInfo.description,
        owner: projectInfo.owner,
        stars: projectInfo.stars,
        language: projectInfo.language,
        topics: projectInfo.topics,
        githubUpdatedAt: projectInfo.updatedAt
          ? new Date(projectInfo.updatedAt)
          : null,
        homepageUrl: projectInfo.homepageUrl,
        license: projectInfo.license,
        githubUrl: githubUrl, // Use the input URL

        // Display info from Agent SDK
        category: projectInfo.category,
        suggestedTags: projectInfo.suggestedTags,

        // Submission metadata
        status: ProjectStatus.PENDING,
        submittedBy: userId,
      },
    });

    this.logger.log(`Project created successfully: ${project.id}`);

    // 4. Return project preview (exclude sensitive fields)
    const { submittedBy, reviewedBy, reviewedAt, rejectionReason, ...preview } =
      project;

    return preview;
  }

  /**
   * Check if a GitHub URL has already been submitted
   * @param githubUrl GitHub repository URL
   * @returns true if project exists, false otherwise
   */
  async isProjectSubmitted(githubUrl: string): Promise<boolean> {
    const project = await this.prismaProject.findUnique({
      where: { githubUrl },
    });
    return !!project;
  }

  /**
   * 获取公开展示的项目列表
   * @param params 查询参数（分页、筛选、排序）
   * @returns 项目列表和分页元数据
   */
  async getProjects(params: {
    page?: number;
    pageSize?: number;
    category?: ProjectCategory;
    language?: string;
    search?: string;
    sort?: 'latest' | 'stars' | 'recentlyAdded';
  }): Promise<ProjectsListResponse> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {
      status: ProjectStatus.APPROVED, // 只返回已审核通过的项目
    };

    // 分类筛选
    if (params.category) {
      where.category = params.category;
    }

    // 语言筛选（模糊匹配）
    if (params.language) {
      where.language = {
        contains: params.language,
        mode: 'insensitive', // 不区分大小写
      };
    }

    // 搜索（仓库名或描述）
    if (params.search) {
      where.OR = [
        { repositoryName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // 排序
    let orderBy: any = {
      createdAt: 'desc', // 默认：最近提交
    };

    if (params.sort === 'stars') {
      orderBy = { stars: 'desc' }; // 星标数最多
    } else if (params.sort === 'latest') {
      orderBy = { githubUpdatedAt: 'desc' }; // 最新更新（GitHub）
    }
    // recentlyAdded 使用默认的 createdAt desc

    // 并行查询数据和总数
    const [items, total] = await Promise.all([
      this.prismaProject.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          repositoryName: true,
          description: true,
          owner: true,
          stars: true,
          language: true,
          topics: true,
          category: true,
          suggestedTags: true,
          screenshotUrl: true,
          githubUrl: true,
          createdAt: true,
          githubUpdatedAt: true,
        },
      }),
      this.prismaProject.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
