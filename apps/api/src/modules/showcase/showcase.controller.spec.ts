import { Test, TestingModule } from '@nestjs/testing';
import { ShowcaseController } from './showcase.controller';
import { ShowcaseService } from './showcase.service';
import { SubmitProjectDto } from './dto/submit-project.dto';

// Using string literal for ProjectStatus to avoid Prisma client import issues
type ProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

describe('ShowcaseController', () => {
  let controller: ShowcaseController;
  let service: any;

  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';
  const mockGithubUrl = 'https://github.com/owner/repo';

  const mockProject = {
    id: 'project-123',
    repositoryName: 'test-repo',
    description: 'Test description',
    owner: 'owner',
    stars: 100,
    language: 'TypeScript',
    topics: ['test'],
    githubUpdatedAt: new Date('2024-01-01T00:00:00Z'),
    homepageUrl: null,
    license: 'MIT',
    githubUrl: mockGithubUrl,
    category: 'WEB_APP',
    suggestedTags: ['test'],
    screenshotUrl: null,
    status: 'PENDING' as ProjectStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockShowcaseService = {
    submitProject: jest.fn(),
    isProjectSubmitted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowcaseController],
      providers: [
        {
          provide: ShowcaseService,
          useValue: mockShowcaseService,
        },
      ],
    }).compile();

    controller = module.get<ShowcaseController>(ShowcaseController);
    service = mockShowcaseService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitProject', () => {
    it('should submit project successfully', async () => {
      const mockUser = { userId: mockUserId, email: mockUserEmail };
      const mockDto: SubmitProjectDto = { githubUrl: mockGithubUrl };

      service.submitProject.mockResolvedValue(mockProject);

      const result = await controller.submitProject(mockDto, mockUser);

      expect(service.submitProject).toHaveBeenCalledWith(
        mockDto.githubUrl,
        mockUser.userId
      );
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('项目提交成功，等待管理员审核');
      expect(result.data).toEqual(mockProject);
    });

    it('should handle different GitHub URLs', async () => {
      const mockUser = { userId: mockUserId, email: mockUserEmail };
      const differentUrl = 'https://github.com/anthropics/claude-code';
      const mockDto: SubmitProjectDto = { githubUrl: differentUrl };

      const differentProject = {
        ...mockProject,
        githubUrl: differentUrl,
        repositoryName: 'claude-code',
        owner: 'anthropics',
      };

      service.submitProject.mockResolvedValue(differentProject);

      const result = await controller.submitProject(mockDto, mockUser);

      expect(service.submitProject).toHaveBeenCalledWith(differentUrl, mockUserId);
      expect(result.data.githubUrl).toBe(differentUrl);
    });

    it('should call service with correct user ID from JWT', async () => {
      const mockUser = { userId: 'different-user-456', email: 'other@example.com' };
      const mockDto: SubmitProjectDto = { githubUrl: mockGithubUrl };

      service.submitProject.mockResolvedValue(mockProject);

      await controller.submitProject(mockDto, mockUser);

      expect(service.submitProject).toHaveBeenCalledWith(
        mockGithubUrl,
        'different-user-456'
      );
    });

    it('should return correct response structure', async () => {
      const mockUser = { userId: mockUserId, email: mockUserEmail };
      const mockDto: SubmitProjectDto = { githubUrl: mockGithubUrl };

      service.submitProject.mockResolvedValue(mockProject);

      const result = await controller.submitProject(mockDto, mockUser);

      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(typeof result.statusCode).toBe('number');
      expect(typeof result.message).toBe('string');
      expect(typeof result.data).toBe('object');
    });
  });
});
