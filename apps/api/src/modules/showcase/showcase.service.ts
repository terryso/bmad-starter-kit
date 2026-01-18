import {
  Injectable,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubFetcherService } from './github-fetcher.service';
import { SyncCacheService } from './services/sync-cache.service';

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
  forks: number;
  openIssues: number;
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
  lastSyncedAt: Date | null;
  lastSyncStatus: string | null;
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

/**
 * 项目详情响应接口
 */
export interface ProjectDetailResponse {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  forks: number;
  openIssues: number;
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
 * 相关项目响应接口
 */
export interface RelatedProject {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  category: ProjectCategory;
  screenshotUrl: string | null;
}

export interface RelatedProjectsResponse {
  items: RelatedProject[];
}

/**
 * 我的项目响应接口
 */
export interface MyProject {
  id: string;
  repositoryName: string;
  description: string;
  owner: string;
  stars: number;
  forks: number;
  openIssues: number;
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

export interface MyProjectsListResponse {
  items: MyProject[];
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
    private syncCache: SyncCacheService,
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
        forks: projectInfo.forks,
        openIssues: projectInfo.openIssues,
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
          forks: true,
          openIssues: true,
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

  /**
   * 获取单个项目详情
   * @param id 项目 ID
   * @returns 项目详细信息
   * @throws NotFoundException 如果项目不存在或未审核通过
   */
  async getProjectById(id: string): Promise<ProjectDetailResponse> {
    const project = await this.prismaProject.findUnique({
      where: { id },
      select: {
        id: true,
        repositoryName: true,
        description: true,
        owner: true,
        stars: true,
        forks: true,
        openIssues: true,
        language: true,
        topics: true,
        category: true,
        suggestedTags: true,
        screenshotUrl: true,
        homepageUrl: true,
        license: true,
        githubUrl: true,
        createdAt: true,
        githubUpdatedAt: true,
        status: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedAt: true,
      },
    });

    // 检查项目是否存在
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 检查项目状态 - 只返回已审核通过的项目
    if (project.status !== ProjectStatus.APPROVED) {
      throw new NotFoundException('Project not found');
    }

    return {
      id: project.id,
      repositoryName: project.repositoryName,
      description: project.description,
      owner: project.owner,
      stars: project.stars,
      forks: project.forks,
      openIssues: project.openIssues,
      language: project.language,
      topics: project.topics,
      category: project.category,
      suggestedTags: project.suggestedTags,
      screenshotUrl: project.screenshotUrl,
      homepageUrl: project.homepageUrl,
      license: project.license,
      githubUrl: project.githubUrl,
      createdAt: project.createdAt.toISOString(),
      githubUpdatedAt: project.githubUpdatedAt?.toISOString() || null,
      submittedBy: project.submittedByUser,
      reviewedBy: project.reviewedByUser,
      reviewedAt: project.reviewedAt?.toISOString() || null,
    };
  }

  /**
   * 获取相关项目推荐
   * @param id 当前项目 ID
   * @returns 相关项目列表（最多 4 个）
   */
  async getRelatedProjects(id: string): Promise<RelatedProjectsResponse> {
    // 首先获取当前项目信息
    const currentProject = await this.prismaProject.findUnique({
      where: { id },
      select: { category: true, language: true },
    });

    if (!currentProject) {
      return { items: [] };
    }

    const limit = 4;
    let items: RelatedProject[] = [];

    // 1. 优先查找同分类的项目
    const sameCategoryProjects = await this.prismaProject.findMany({
      where: {
        id: { not: id }, // 排除当前项目
        status: ProjectStatus.APPROVED,
        category: currentProject.category,
      },
      select: {
        id: true,
        repositoryName: true,
        description: true,
        owner: true,
        stars: true,
        forks: true,
        openIssues: true,
        language: true,
        category: true,
        screenshotUrl: true,
      },
      take: limit,
      orderBy: { stars: 'desc' }, // 按星标数排序
    });

    items = sameCategoryProjects;

    // 2. 如果同分类项目不足 4 个，补充同语言项目
    if (items.length < limit && currentProject.language) {
      const needed = limit - items.length;
      const sameLanguageProjects = await this.prismaProject.findMany({
        where: {
          id: { not: id },
          status: ProjectStatus.APPROVED,
          category: { not: currentProject.category }, // 排除已获取的分类
          language: { contains: currentProject.language, mode: 'insensitive' },
        },
        select: {
          id: true,
          repositoryName: true,
          description: true,
          owner: true,
          stars: true,
          language: true,
          category: true,
          screenshotUrl: true,
        },
        take: needed,
        orderBy: { stars: 'desc' },
      });

      items = [...items, ...sameLanguageProjects];
    }

    return { items };
  }

  /**
   * 获取当前用户提交的项目列表
   * @param userId 当前用户 ID
   * @param params 查询参数（分页、状态筛选）
   * @returns 用户的项目列表和分页元数据
   */
  async getMyProjects(
    userId: string,
    params: {
      page?: number;
      pageSize?: number;
      status?: ProjectStatus;
    },
  ): Promise<MyProjectsListResponse> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {
      submittedBy: userId, // 只返回当前用户提交的项目
    };

    // 状态筛选
    if (params.status) {
      where.status = params.status;
    }

    // 并行查询数据和总数
    const [items, total] = await Promise.all([
      this.prismaProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          repositoryName: true,
          description: true,
          owner: true,
          stars: true,
          forks: true,
          openIssues: true,
          language: true,
          topics: true,
          category: true,
          suggestedTags: true,
          screenshotUrl: true,
          githubUrl: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      }),
      this.prismaProject.count({ where }),
    ]);

    return {
      items: items.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        reviewedAt: item.reviewedAt?.toISOString() || null,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 删除用户提交的项目
   * 只能删除状态为 PENDING 或 REJECTED 的项目
   * 已批准的项目不能删除
   * @param projectId 项目 ID
   * @param userId 当前用户 ID
   * @throws NotFoundException 如果项目不存在
   * @throws ConflictException 如果项目已批准或不是用户提交的
   */
  async deleteMyProject(projectId: string, userId: string): Promise<void> {
    // 查询项目
    const project = await this.prismaProject.findUnique({
      where: { id: projectId },
    });

    // 检查项目是否存在
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 验证项目所有权
    if (project.submittedBy !== userId) {
      throw new ForbiddenException('无权删除此项目');
    }

    // 检查项目状态 - 已批准的项目不能删除
    if (project.status === ProjectStatus.APPROVED) {
      throw new ForbiddenException('已批准的项目不能删除');
    }

    // 删除项目
    await this.prismaProject.delete({
      where: { id: projectId },
    });

    this.logger.log(`Project ${projectId} deleted by user ${userId}`);
  }

  /**
   * 同步项目的最新 GitHub 信息
   * @param projectId 项目 ID
   * @param userId 当前用户 ID
   * @returns 更新后的项目信息
   * @throws NotFoundException 如果项目不存在
   * @throws HttpException 429 如果距离上次同步不足 5 分钟
   */
  async syncProject(
    projectId: string,
    userId: string,
  ): Promise<{
    id: string;
    stars: number;
    forks: number;
    openIssues: number;
    description: string;
    topics: string[];
    lastSyncedAt: string;
    githubUpdatedAt: string;
    lastSyncStatus: string;
  }> {
    this.logger.log(`User ${userId} syncing project ${projectId}`);

    // 1. 检查项目是否存在
    const project = await this.prismaProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 2. 验证用户权限：只有项目提交者可以同步
    if (project.submittedBy !== userId) {
      throw new ForbiddenException('您没有权限同步此项目');
    }

    // 3. 检查速率限制（5分钟冷却）
    if (!this.syncCache.canSync(userId, projectId)) {
      const remainingSeconds = Math.ceil(
        this.syncCache.getRemainingCooldown(userId, projectId) / 1000,
      );
      throw new HttpException(
        `距离上次同步不到 5 分钟，请稍后再试（还需等待 ${remainingSeconds} 秒）`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 4. 调用 GitHub API 获取最新数据
    try {
      // 使用现有的 GithubFetcherService 获取项目信息
      const projectInfo = await this.githubFetcher.fetchProjectInfo(
        project.githubUrl,
      );

      // 5. 更新数据库
      const now = new Date();
      const updatedProject = await this.prismaProject.update({
        where: { id: projectId },
        data: {
          stars: projectInfo.stars,
          forks: projectInfo.forks,
          openIssues: projectInfo.openIssues,
          description: projectInfo.description,
          topics: projectInfo.topics,
          githubUpdatedAt: projectInfo.updatedAt
            ? new Date(projectInfo.updatedAt)
            : null,
          lastSyncedAt: now,
          lastSyncStatus: 'SUCCESS',
        },
        select: {
          id: true,
          stars: true,
          forks: true,
          openIssues: true,
          description: true,
          topics: true,
          lastSyncedAt: true,
          githubUpdatedAt: true,
          lastSyncStatus: true,
        },
      });

      // 6. 记录同步尝试（成功后才记录）
      this.syncCache.setSyncAttempt(userId, projectId);

      this.logger.log(`Project ${projectId} synced successfully`);

      return {
        id: updatedProject.id,
        stars: updatedProject.stars,
        forks: updatedProject.forks,
        openIssues: updatedProject.openIssues,
        description: updatedProject.description,
        topics: updatedProject.topics,
        lastSyncedAt: updatedProject.lastSyncedAt!.toISOString(),
        githubUpdatedAt:
          updatedProject.githubUpdatedAt?.toISOString() || now.toISOString(),
        lastSyncStatus: updatedProject.lastSyncStatus!,
      };
    } catch (error) {
      // 同步失败，不计入速率限制
      this.logger.error(`Failed to sync project ${projectId}:`, error);

      // 更新数据库记录失败状态
      try {
        await this.prismaProject.update({
          where: { id: projectId },
          data: {
            lastSyncStatus: 'FAILED',
          },
        });
      } catch (updateError) {
        this.logger.error('Failed to update sync status:', updateError);
      }

      // 重新抛出错误，让 controller 处理
      throw error;
    }
  }
}
