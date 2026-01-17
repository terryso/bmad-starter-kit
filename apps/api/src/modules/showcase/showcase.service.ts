import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubFetcherService } from './github-fetcher.service';

/**
 * Project Status Enum (from Prisma schema)
 */
export enum ProjectStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Project Category Enum (from Prisma schema)
 */
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
}
