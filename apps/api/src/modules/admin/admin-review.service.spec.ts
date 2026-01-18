/**
 * Admin Service - 项目审核功能单元测试
 *
 * 测试管理员审核待审核项目的业务逻辑
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-6: 管理员审核界面
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus } from '../showcase/showcase.service';
import { RejectProjectDto } from './dto/reject-project.dto';
import { PendingProjectsQueryDto } from './dto/pending-projects-query.dto';

describe('AdminService - 项目审核功能', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrismaProject = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockPrisma = {
    project: mockPrismaProject,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('getPendingProjects', () => {
    it('[P0] 应返回 PENDING 状态的项目列表', async () => {
      const mockProjects = [
        {
          id: 'project1',
          repositoryName: 'test-repo',
          description: 'Test description',
          owner: 'testowner',
          stars: 100,
          language: 'TypeScript',
          category: 'WEB_APP',
          topics: ['web', 'test'],
          suggestedTags: ['测试'],
          screenshotUrl: null,
          githubUrl: 'https://github.com/testowner/test-repo',
          submittedBy: {
            id: 'user1',
            name: 'Test User',
            email: 'test@example.com',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockPrismaProject.findMany.mockResolvedValue(mockProjects);
      mockPrismaProject.count.mockResolvedValue(1);

      const query = new PendingProjectsQueryDto();
      query.page = 1;
      query.pageSize = 12;

      const result = await service.getPendingProjects(query);

      expect(result).toMatchObject({
        items: expect.any(Array),
        meta: {
          total: 1,
          page: 1,
          pageSize: 12,
          totalPages: 1,
        },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].repositoryName).toBe('test-repo');
      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: ProjectStatus.PENDING,
          },
        })
      );
    });

    it('[P1] 应正确处理分页参数', async () => {
      mockPrismaProject.findMany.mockResolvedValue([]);
      mockPrismaProject.count.mockResolvedValue(0);

      const query = new PendingProjectsQueryDto();
      query.page = 2;
      query.pageSize = 5;

      await service.getPendingProjects(query);

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * pageSize = (2 - 1) * 5
          take: 5,
        })
      );
    });

    it('[P2] 应按创建时间升序排列', async () => {
      mockPrismaProject.findMany.mockResolvedValue([]);
      mockPrismaProject.count.mockResolvedValue(0);

      const query = new PendingProjectsQueryDto();

      await service.getPendingProjects(query);

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'asc',
          },
        })
      );
    });
  });

  describe('getPendingProjectsCount', () => {
    it('[P1] 应返回待审核项目数量', async () => {
      mockPrismaProject.count.mockResolvedValue(5);

      const result = await service.getPendingProjectsCount();

      expect(result).toBe(5);
      expect(mockPrismaProject.count).toHaveBeenCalledWith({
        where: {
          status: ProjectStatus.PENDING,
        },
      });
    });

    it('[P1] 没有待审核项目时应返回 0', async () => {
      mockPrismaProject.count.mockResolvedValue(0);

      const result = await service.getPendingProjectsCount();

      expect(result).toBe(0);
    });
  });

  describe('approveProject', () => {
    it('[P0] 应成功批准待审核项目', async () => {
      const mockProject = {
        id: 'project1',
        status: ProjectStatus.PENDING,
      };

      const mockUpdatedProject = {
        id: 'project1',
        repositoryName: 'test-repo',
        description: 'Test description',
        owner: 'testowner',
        stars: 100,
        language: 'TypeScript',
        category: 'WEB_APP',
        topics: ['web'],
        suggestedTags: ['测试'],
        screenshotUrl: null,
        githubUrl: 'https://github.com/testowner/test-repo',
        submittedBy: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPrismaProject.findUnique.mockResolvedValue(mockProject);
      mockPrismaProject.update.mockResolvedValue(mockUpdatedProject);

      const result = await service.approveProject('project1', 'admin1');

      expect(result).toBeDefined();
      expect(mockPrismaProject.update).toHaveBeenCalledWith({
        where: { id: 'project1' },
        data: {
          status: ProjectStatus.APPROVED,
          reviewedBy: 'admin1',
          reviewedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('[P0] 项目不存在应抛出 NotFoundException', async () => {
      mockPrismaProject.findUnique.mockResolvedValue(null);

      await expect(service.approveProject('nonexistent', 'admin1'))
        .rejects.toThrow(NotFoundException);
    });

    it('[P0] 项目状态不是 PENDING 应抛出 BadRequestException', async () => {
      mockPrismaProject.findUnique.mockResolvedValue({
        id: 'project1',
        status: ProjectStatus.APPROVED,
      });

      await expect(service.approveProject('project1', 'admin1'))
        .rejects.toThrow(BadRequestException);
    });

    it('[P2] 已批准的项目应被拒绝', async () => {
      mockPrismaProject.findUnique.mockResolvedValue({
        id: 'project1',
        status: ProjectStatus.APPROVED,
      });

      await expect(service.approveProject('project1', 'admin1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectProject', () => {
    it('[P0] 应成功拒绝待审核项目', async () => {
      const mockProject = {
        id: 'project1',
        status: ProjectStatus.PENDING,
      };

      const mockUpdatedProject = {
        id: 'project1',
        repositoryName: 'test-repo',
        description: 'Test description',
        owner: 'testowner',
        stars: 100,
        language: 'TypeScript',
        category: 'WEB_APP',
        topics: ['web'],
        suggestedTags: ['测试'],
        screenshotUrl: null,
        githubUrl: 'https://github.com/testowner/test-repo',
        submittedBy: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPrismaProject.findUnique.mockResolvedValue(mockProject);
      mockPrismaProject.update.mockResolvedValue(mockUpdatedProject);

      const dto = new RejectProjectDto();
      dto.rejectionReason = '项目描述不完整';

      const result = await service.rejectProject('project1', dto, 'admin1');

      expect(result).toBeDefined();
      expect(mockPrismaProject.update).toHaveBeenCalledWith({
        where: { id: 'project1' },
        data: {
          status: ProjectStatus.REJECTED,
          rejectionReason: '项目描述不完整',
          reviewedBy: 'admin1',
          reviewedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('[P0] 拒绝原因应被正确保存', async () => {
      const mockProject = {
        id: 'project1',
        status: ProjectStatus.PENDING,
      };

      const mockUpdatedProject = {
        id: 'project1',
        repositoryName: 'test-repo',
        description: 'Test description',
        owner: 'testowner',
        stars: 100,
        language: 'TypeScript',
        category: 'WEB_APP',
        topics: ['web'],
        suggestedTags: ['测试'],
        screenshotUrl: null,
        githubUrl: 'https://github.com/testowner/test-repo',
        submittedBy: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPrismaProject.findUnique.mockResolvedValue(mockProject);
      mockPrismaProject.update.mockResolvedValue(mockUpdatedProject);

      const dto = new RejectProjectDto();
      const reason = '这是一个很长的拒绝原因，用于测试系统是否正确保存完整的拒绝原因信息';
      dto.rejectionReason = reason;

      await service.rejectProject('project1', dto, 'admin1');

      expect(mockPrismaProject.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rejectionReason: reason,
          }),
        })
      );
    });

    it('[P0] 项目不存在应抛出 NotFoundException', async () => {
      mockPrismaProject.findUnique.mockResolvedValue(null);

      const dto = new RejectProjectDto();
      dto.rejectionReason = '测试原因';

      await expect(service.rejectProject('nonexistent', dto, 'admin1'))
        .rejects.toThrow(NotFoundException);
    });

    it('[P0] 项目状态不是 PENDING 应抛出 BadRequestException', async () => {
      mockPrismaProject.findUnique.mockResolvedValue({
        id: 'project1',
        status: ProjectStatus.APPROVED,
      });

      const dto = new RejectProjectDto();
      dto.rejectionReason = '测试原因';

      await expect(service.rejectProject('project1', dto, 'admin1'))
        .rejects.toThrow(BadRequestException);
    });

    it('[P1] 拒绝原因的验证在 DTO 层处理', async () => {
      // DTO 验证由 class-validator 处理
      // 这里只验证 service 逻辑
      const mockProject = {
        id: 'project1',
        status: ProjectStatus.PENDING,
      };

      const mockUpdatedProject = {
        id: 'project1',
        repositoryName: 'test-repo',
        description: 'Test description',
        owner: 'testowner',
        stars: 100,
        language: 'TypeScript',
        category: 'WEB_APP',
        topics: ['web'],
        suggestedTags: ['测试'],
        screenshotUrl: null,
        githubUrl: 'https://github.com/testowner/test-repo',
        submittedBy: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPrismaProject.findUnique.mockResolvedValue(mockProject);
      mockPrismaProject.update.mockResolvedValue(mockUpdatedProject);

      const dto = new RejectProjectDto();
      dto.rejectionReason = 'abcde'; // 5 个字符，满足最小要求

      const result = await service.rejectProject('project1', dto, 'admin1');

      expect(result).toBeDefined();
      expect(mockPrismaProject.update).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('[P2] 空项目列表应返回正确结构', async () => {
      mockPrismaProject.findMany.mockResolvedValue([]);
      mockPrismaProject.count.mockResolvedValue(0);

      const query = new PendingProjectsQueryDto();

      const result = await service.getPendingProjects(query);

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('[P2] 分页超过范围应返回空列表', async () => {
      mockPrismaProject.findMany.mockResolvedValue([]);
      mockPrismaProject.count.mockResolvedValue(5);

      const query = new PendingProjectsQueryDto();
      query.page = 100;
      query.pageSize = 10;

      const result = await service.getPendingProjects(query);

      expect(result.items).toEqual([]);
      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 990,
          take: 10,
        })
      );
    });
  });
});
