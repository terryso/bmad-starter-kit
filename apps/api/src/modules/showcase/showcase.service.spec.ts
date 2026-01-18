import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ShowcaseService, ProjectCategory } from './showcase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubFetcherService } from './github-fetcher.service';
import { SyncCacheService } from './services/sync-cache.service';

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
        {
          provide: SyncCacheService,
          useValue: {
            canSync: jest.fn().mockReturnValue(true),
            setSyncAttempt: jest.fn(),
            getRemainingCooldown: jest.fn().mockReturnValue(0),
          },
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

  describe('getProjectById', () => {
    const createMockProjectDetail = (overrides: any = {}) => ({
      id: 'project-123',
      repositoryName: 'test-repo',
      description: 'Test description',
      owner: 'testowner',
      stars: 1234,
      language: 'TypeScript',
      topics: ['test', 'testing'],
      category: 'WEB_APP',
      suggestedTags: ['test'],
      screenshotUrl: null,
      homepageUrl: 'https://test.dev',
      license: 'MIT',
      githubUrl: 'https://github.com/testowner/test-repo',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      githubUpdatedAt: new Date('2024-01-15T10:30:00.000Z'),
      status: 'APPROVED' as ProjectStatus,
      submittedByUser: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
      reviewedByUser: {
        id: 'admin-456',
        name: 'Admin User',
        email: 'admin@example.com',
      },
      reviewedAt: new Date('2024-01-18T10:00:00.000Z'),
      ...overrides,
    });

    it('should return APPROVED project details', async () => {
      const mockProject = createMockProjectDetail();
      mockPrismaProject.findUnique.mockResolvedValue(mockProject);

      const result = await service.getProjectById('project-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('project-123');
      expect(result.repositoryName).toBe('test-repo');
      expect(result.stars).toBe(1234);
      expect(result.language).toBe('TypeScript');
      expect(result.submittedBy).toBeDefined();
      expect(result.submittedBy.email).toBe('test@example.com');
      expect(mockPrismaProject.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException for non-existent project', async () => {
      mockPrismaProject.findUnique.mockResolvedValue(null);

      await expect(service.getProjectById('nonexistent-id'))
        .rejects.toThrow(NotFoundException);

      await expect(service.getProjectById('nonexistent-id'))
        .rejects.toThrow('Project not found');
    });

    it('should throw NotFoundException for PENDING project', async () => {
      const pendingProject = createMockProjectDetail({ status: 'PENDING' as ProjectStatus });
      mockPrismaProject.findUnique.mockResolvedValue(pendingProject);

      await expect(service.getProjectById('pending-id'))
        .rejects.toThrow(NotFoundException);

      await expect(service.getProjectById('pending-id'))
        .rejects.toThrow('Project not found');
    });

    it('should throw NotFoundException for REJECTED project', async () => {
      const rejectedProject = createMockProjectDetail({
        status: 'REJECTED' as ProjectStatus,
        rejectionReason: 'Spam',
      });
      mockPrismaProject.findUnique.mockResolvedValue(rejectedProject);

      await expect(service.getProjectById('rejected-id'))
        .rejects.toThrow(NotFoundException);
    });

    it('should include submitter information', async () => {
      const mockProject = createMockProjectDetail();
      mockPrismaProject.findUnique.mockResolvedValue(mockProject);

      const result = await service.getProjectById('project-123');

      expect(result.submittedBy).toBeDefined();
      expect(result.submittedBy.id).toBe('user-123');
      expect(result.submittedBy.name).toBe('Test User');
      expect(result.submittedBy.email).toBe('test@example.com');
    });

    it('should include reviewer information when reviewed', async () => {
      const mockProject = createMockProjectDetail();
      mockPrismaProject.findUnique.mockResolvedValue(mockProject);

      const result = await service.getProjectById('project-123');

      expect(result.reviewedBy).toBeDefined();
      expect(result.reviewedBy.id).toBe('admin-456');
      expect(result.reviewedBy.name).toBe('Admin User');
      expect(result.reviewedAt).toBe('2024-01-18T10:00:00.000Z');
    });

    it('should return null for reviewedBy when not reviewed', async () => {
      const unreviewedProject = createMockProjectDetail({
        reviewedByUser: null,
        reviewedAt: null,
      });
      mockPrismaProject.findUnique.mockResolvedValue(unreviewedProject);

      const result = await service.getProjectById('project-123');

      expect(result.reviewedBy).toBeNull();
      expect(result.reviewedAt).toBeNull();
    });

    it('should handle null optional fields correctly', async () => {
      const minimalProject = createMockProjectDetail({
        language: null,
        homepageUrl: null,
        license: null,
        screenshotUrl: null,
        githubUpdatedAt: null,
      });
      mockPrismaProject.findUnique.mockResolvedValue(minimalProject);

      const result = await service.getProjectById('project-123');

      expect(result.language).toBeNull();
      expect(result.homepageUrl).toBeNull();
      expect(result.license).toBeNull();
      expect(result.githubUpdatedAt).toBeNull();
    });

    it('should convert dates to ISO strings', async () => {
      const mockProject = createMockProjectDetail();
      mockPrismaProject.findUnique.mockResolvedValue(mockProject);

      const result = await service.getProjectById('project-123');

      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.githubUpdatedAt).toBe('2024-01-15T10:30:00.000Z');
      expect(result.reviewedAt).toBe('2024-01-18T10:00:00.000Z');
    });
  });

  describe('getRelatedProjects', () => {
    beforeEach(() => {
      // Clear all mocks before each test to prevent pollution
      mockPrismaProject.findUnique.mockReset();
      mockPrismaProject.findMany.mockReset();
    });

    const createMockRelatedProject = (overrides: any = {}) => ({
      id: 'related-project-1',
      repositoryName: 'related-repo',
      description: 'A related project',
      owner: 'relatedowner',
      stars: 500,
      language: 'TypeScript',
      category: 'WEB_APP',
      screenshotUrl: null,
      ...overrides,
    });

    it('should return projects with same category', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Return 4 items to avoid triggering language fallback (since language is set)
      const relatedProjects = [
        createMockRelatedProject({ id: 'related-1', category: 'WEB_APP' }),
        createMockRelatedProject({ id: 'related-2', category: 'WEB_APP' }),
        createMockRelatedProject({ id: 'related-3', category: 'WEB_APP' }),
        createMockRelatedProject({ id: 'related-4', category: 'WEB_APP' }),
      ];

      // First call: get current project
      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      // Second call: get related projects (uses findMany in service)
      mockPrismaProject.findMany.mockResolvedValueOnce(relatedProjects);

      const result = await service.getRelatedProjects('current-project-id');

      expect(result.items).toHaveLength(4);
      result.items.forEach(p => {
        expect(p.category).toBe('WEB_APP');
      });
    });

    it('should exclude current project from results', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Return 4 items to avoid triggering language fallback
      const relatedProjects = [
        createMockRelatedProject({ id: 'related-1' }),
        createMockRelatedProject({ id: 'related-2' }),
        createMockRelatedProject({ id: 'related-3' }),
        createMockRelatedProject({ id: 'related-4' }),
      ];

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce(relatedProjects);

      const result = await service.getRelatedProjects('current-project-id');

      result.items.forEach(p => {
        expect(p.id).not.toBe('current-project-id');
      });
    });

    it('should return maximum 4 related projects', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Service uses take: 4 in the query, so mock returns 4 items
      // (in real scenario, Prisma would limit to 4 due to take parameter)
      const manyRelatedProjects = Array.from({ length: 4 }, (_, i) =>
        createMockRelatedProject({ id: `related-${i}`, category: 'WEB_APP' })
      );

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce(manyRelatedProjects);

      const result = await service.getRelatedProjects('current-project-id');

      expect(result.items.length).toBeLessThanOrEqual(4);
    });

    it('should return exactly 4 projects when 4 are available', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      const relatedProjects = Array.from({ length: 4 }, (_, i) =>
        createMockRelatedProject({ id: `related-${i}`, category: 'WEB_APP' })
      );

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce(relatedProjects);

      const result = await service.getRelatedProjects('current-project-id');

      expect(result.items).toHaveLength(4);
    });

    it('should fallback to same language when same category < 4', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Only 2 same category projects
      const sameCategoryProjects = [
        createMockRelatedProject({ id: 'same-cat-1', category: 'WEB_APP' }),
        createMockRelatedProject({ id: 'same-cat-2', category: 'WEB_APP' }),
      ];

      // 2 same language projects (different category)
      const sameLanguageProjects = [
        createMockRelatedProject({ id: 'same-lang-1', category: 'LIBRARY', language: 'TypeScript' }),
        createMockRelatedProject({ id: 'same-lang-2', category: 'API', language: 'TypeScript' }),
      ];

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany
        .mockResolvedValueOnce(sameCategoryProjects)
        .mockResolvedValueOnce(sameLanguageProjects);

      const result = await service.getRelatedProjects('current-project-id');

      // Should have 4 total: 2 from same category + 2 from same language
      expect(result.items).toHaveLength(4);
      expect(result.items.filter(p => p.category === 'WEB_APP')).toHaveLength(2);
      expect(result.items.filter(p => p.language === 'TypeScript')).toHaveLength(4);
    });

    it('should return empty array when current project not found', async () => {
      mockPrismaProject.findUnique.mockResolvedValueOnce(null);

      const result = await service.getRelatedProjects('nonexistent-id');

      expect(result.items).toEqual([]);
      expect(mockPrismaProject.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaProject.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when no related projects exist', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Mock both findMany calls - first for same category (returns empty),
      // second for same language fallback (also returns empty)
      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.getRelatedProjects('unique-project-id');

      expect(result.items).toEqual([]);
    });

    it('should not fallback to language when current project has no language', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: null,
      };

      const sameCategoryProjects = [
        createMockRelatedProject({ id: 'related-1', category: 'WEB_APP' }),
      ];

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce(sameCategoryProjects);

      const result = await service.getRelatedProjects('current-project-id');

      // Should only call findMany once (same category only)
      expect(result.items).toHaveLength(1);
      expect(mockPrismaProject.findMany).toHaveBeenCalledTimes(1);
    });

    it('should sort related projects by stars descending', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Return 4 items to avoid language fallback (since language is set)
      const relatedProjects = [
        createMockRelatedProject({ id: 'related-1', stars: 100 }),
        createMockRelatedProject({ id: 'related-2', stars: 500 }),
        createMockRelatedProject({ id: 'related-3', stars: 300 }),
        createMockRelatedProject({ id: 'related-4', stars: 200 }),
      ];

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce(relatedProjects);

      await service.getRelatedProjects('current-project-id');

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'APPROVED',
          category: 'WEB_APP',
        }),
        select: expect.any(Object),
        take: 4,
        orderBy: { stars: 'desc' },
      });
    });

    it('should only return APPROVED projects', async () => {
      const currentProject = {
        category: 'WEB_APP',
        language: 'TypeScript',
      };

      // Return 4 same-category projects to avoid language fallback
      const sameCategoryProjects = [
        createMockRelatedProject({ id: 'related-1' }),
        createMockRelatedProject({ id: 'related-2' }),
        createMockRelatedProject({ id: 'related-3' }),
        createMockRelatedProject({ id: 'related-4' }),
      ];

      mockPrismaProject.findUnique.mockResolvedValueOnce(currentProject);
      mockPrismaProject.findMany.mockResolvedValueOnce(sameCategoryProjects);

      await service.getRelatedProjects('current-project-id');

      const findManyCall = mockPrismaProject.findMany.mock.calls[0];
      expect(findManyCall).toBeDefined();
      expect(findManyCall[0].where.status).toBe('APPROVED');
    });
  });
});
