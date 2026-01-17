import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ShowcaseService } from './showcase.service';
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
});
