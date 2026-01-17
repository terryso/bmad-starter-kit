import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ShowcaseService, ProjectCategory } from './showcase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubFetcherService } from './github-fetcher.service';

// Using string literal for ProjectStatus to avoid Prisma client import issues
type ProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

describe('ShowcaseService', () => {
  let service: ShowcaseService;
  let prisma: any;
  let githubFetcher: any;

  const mockUserId = 'user-123';
  const mockGithubUrl = 'https://github.com/owner/repo';
  const mockProjectInfo = {
    repositoryName: 'test-repo',
    description: 'Test description',
    owner: 'owner',
    stars: 100,
    language: 'TypeScript',
    topics: ['test'],
    updatedAt: '2024-01-01T00:00:00Z',
    homepageUrl: null,
    license: 'MIT',
    category: 'WEB_APP' as const,
    suggestedTags: ['test'],
  };

  const mockProject = {
    id: 'project-123',
    repositoryName: mockProjectInfo.repositoryName,
    description: mockProjectInfo.description,
    owner: mockProjectInfo.owner,
    stars: mockProjectInfo.stars,
    language: mockProjectInfo.language,
    topics: mockProjectInfo.topics,
    githubUpdatedAt: new Date(mockProjectInfo.updatedAt),
    homepageUrl: mockProjectInfo.homepageUrl,
    license: mockProjectInfo.license,
    githubUrl: mockGithubUrl,
    category: 'WEB_APP',
    suggestedTags: mockProjectInfo.suggestedTags,
    screenshotUrl: null,
    status: 'PENDING' as ProjectStatus,
    submittedBy: mockUserId,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaProject = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const mockGithubFetcher = {
    fetchProjectInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowcaseService,
        {
          provide: PrismaService,
          useValue: {
            project: mockPrismaProject,
          },
        },
        {
          provide: GithubFetcherService,
          useValue: mockGithubFetcher,
        },
      ],
    }).compile();

    service = module.get<ShowcaseService>(ShowcaseService);
    prisma = module.get(PrismaService);
    githubFetcher = module.get(GithubFetcherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitProject', () => {
    it('should create project successfully', async () => {
      mockPrismaProject.findUnique.mockResolvedValue(null);
      mockGithubFetcher.fetchProjectInfo.mockResolvedValue(mockProjectInfo);
      mockPrismaProject.create.mockResolvedValue(mockProject);

      const result = await service.submitProject(mockGithubUrl, mockUserId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { githubUrl: mockGithubUrl },
      });
      expect(githubFetcher.fetchProjectInfo).toHaveBeenCalledWith(mockGithubUrl);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          repositoryName: mockProjectInfo.repositoryName,
          description: mockProjectInfo.description,
          owner: mockProjectInfo.owner,
          stars: mockProjectInfo.stars,
          language: mockProjectInfo.language,
          topics: mockProjectInfo.topics,
          githubUrl: mockGithubUrl,
          category: mockProjectInfo.category,
          suggestedTags: mockProjectInfo.suggestedTags,
          status: 'PENDING',
          submittedBy: mockUserId,
        }),
      });
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('submittedBy');
      expect(result).not.toHaveProperty('reviewedBy');
      expect(result).not.toHaveProperty('reviewedAt');
      expect(result).not.toHaveProperty('rejectionReason');
    });

    it('should throw ConflictException if project already exists', async () => {
      mockPrismaProject.findUnique.mockResolvedValue({
        id: 'existing-project',
      });

      await expect(
        service.submitProject(mockGithubUrl, mockUserId)
      ).rejects.toThrow(ConflictException);

      await expect(
        service.submitProject(mockGithubUrl, mockUserId)
      ).rejects.toThrow('该项目已被提交，请勿重复提交');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { githubUrl: mockGithubUrl },
      });
      expect(githubFetcher.fetchProjectInfo).not.toHaveBeenCalled();
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('should pass through GitHub fetcher errors', async () => {
      const error = new Error('GitHub API error');
      mockPrismaProject.findUnique.mockResolvedValue(null);
      mockGithubFetcher.fetchProjectInfo.mockRejectedValue(error);

      await expect(
        service.submitProject(mockGithubUrl, mockUserId)
      ).rejects.toThrow('GitHub API error');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { githubUrl: mockGithubUrl },
      });
      expect(githubFetcher.fetchProjectInfo).toHaveBeenCalledWith(mockGithubUrl);
      expect(prisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('isProjectSubmitted', () => {
    it('should return true if project exists', async () => {
      mockPrismaProject.findUnique.mockResolvedValue({
        id: 'existing-project',
      });

      const result = await service.isProjectSubmitted(mockGithubUrl);

      expect(result).toBe(true);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { githubUrl: mockGithubUrl },
      });
    });

    it('should return false if project does not exist', async () => {
      mockPrismaProject.findUnique.mockResolvedValue(null);

      const result = await service.isProjectSubmitted(mockGithubUrl);

      expect(result).toBe(false);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { githubUrl: mockGithubUrl },
      });
    });
  });

  describe('getProjects', () => {
    // 模拟 Prisma select 返回的数据（不包含敏感字段）
    const createMockProjectPreview = (overrides: any = {}) => ({
      id: 'project-123',
      repositoryName: 'test-repo',
      description: 'Test description',
      owner: 'owner',
      stars: 100,
      language: 'TypeScript',
      topics: ['test'],
      category: 'WEB_APP',
      suggestedTags: ['test'],
      screenshotUrl: null,
      githubUrl: 'https://github.com/owner/repo',
      createdAt: new Date(),
      githubUpdatedAt: new Date(),
      ...overrides,
    });

    const mockApprovedProjects = [
      createMockProjectPreview({
        id: 'project-1',
        repositoryName: 'approved-project-1',
        stars: 500,
      }),
      createMockProjectPreview({
        id: 'project-2',
        repositoryName: 'approved-project-2',
        stars: 1000,
      }),
      createMockProjectPreview({
        id: 'project-3',
        repositoryName: 'approved-project-3',
        stars: 250,
      }),
    ];

    const mockPendingProject = {
      ...mockProject,
      id: 'pending-project',
      status: 'PENDING' as ProjectStatus,
      repositoryName: 'pending-project',
    };

    beforeEach(() => {
      // Reset mocks before each test
      mockPrismaProject.findMany.mockReset();
      mockPrismaProject.count.mockReset();
    });

    it('should return only APPROVED projects', async () => {
      const allProjects = [...mockApprovedProjects, mockPendingProject];
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      const result = await service.getProjects({});

      expect(result.items).toHaveLength(3);
      expect(result.items.every(p => !('submittedBy' in p))).toBe(true);
      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
          }),
        })
      );
    });

    it('should filter by category', async () => {
      const webAppProjects = mockApprovedProjects.filter(p => p.category === ProjectCategory.WEB_APP);
      mockPrismaProject.findMany.mockResolvedValue(webAppProjects);
      mockPrismaProject.count.mockResolvedValue(webAppProjects.length);

      await service.getProjects({ category: ProjectCategory.WEB_APP });

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
            category: ProjectCategory.WEB_APP,
          }),
        })
      );
    });

    it('should filter by language with insensitive mode', async () => {
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      await service.getProjects({ language: 'typescript' });

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
            language: {
              contains: 'typescript',
              mode: 'insensitive',
            },
          }),
        })
      );
    });

    it('should search in repositoryName and description', async () => {
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      await service.getProjects({ search: 'test' });

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
            OR: [
              { repositoryName: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should sort by stars descending', async () => {
      const sortedByStars = [...mockApprovedProjects].sort((a, b) => b.stars - a.stars);
      mockPrismaProject.findMany.mockResolvedValue(sortedByStars);
      mockPrismaProject.count.mockResolvedValue(sortedByStars.length);

      await service.getProjects({ sort: 'stars' });

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { stars: 'desc' },
        })
      );
    });

    it('should sort by githubUpdatedAt (latest) descending', async () => {
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      await service.getProjects({ sort: 'latest' });

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { githubUpdatedAt: 'desc' },
        })
      );
    });

    it('should sort by createdAt (recentlyAdded) by default', async () => {
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      await service.getProjects({});

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should paginate correctly', async () => {
      mockPrismaProject.findMany.mockResolvedValue([mockApprovedProjects[0]]);
      mockPrismaProject.count.mockResolvedValue(25);

      const result = await service.getProjects({ page: 2, pageSize: 10 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.pageSize).toBe(10);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(25);
      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should use default pagination values', async () => {
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      await service.getProjects({});

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 12,
        })
      );
    });

    it('should exclude sensitive fields from response', async () => {
      mockPrismaProject.findMany.mockResolvedValue(mockApprovedProjects);
      mockPrismaProject.count.mockResolvedValue(mockApprovedProjects.length);

      const result = await service.getProjects({});

      result.items.forEach(item => {
        expect(item).not.toHaveProperty('submittedBy');
        expect(item).not.toHaveProperty('reviewedBy');
        expect(item).not.toHaveProperty('reviewedAt');
        expect(item).not.toHaveProperty('rejectionReason');
      });
    });

    it('should handle multiple filters combined', async () => {
      mockPrismaProject.findMany.mockResolvedValue([mockApprovedProjects[0]]);
      mockPrismaProject.count.mockResolvedValue(1);

      await service.getProjects({
        category: ProjectCategory.WEB_APP,
        language: 'TypeScript',
        search: 'approved',
        sort: 'stars',
        page: 1,
        pageSize: 12,
      });

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'APPROVED',
            category: ProjectCategory.WEB_APP,
            language: { contains: 'TypeScript', mode: 'insensitive' },
            OR: [
              { repositoryName: { contains: 'approved', mode: 'insensitive' } },
              { description: { contains: 'approved', mode: 'insensitive' } },
            ],
          },
          orderBy: { stars: 'desc' },
          skip: 0,
          take: 12,
        })
      );
    });
  });
});
