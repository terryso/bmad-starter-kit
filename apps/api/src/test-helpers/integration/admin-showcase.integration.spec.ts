/**
 * 管理员项目审核 API 集成测试
 *
 * 测试管理员审核待审核项目的 API 端点
 *
 * 覆盖 Epic 8: BMAD 项目展示平台
 * Story 8-6: 管理员审核界面
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../../modules/admin/admin.service';
import { AdminController } from '../../modules/admin/admin.controller';
import { Role } from '@prisma/client';
import { ApiIntegrationFixture, createApiFixture } from '../fixtures/api-integration.fixture';
import { ProjectStatus } from '../../modules/showcase/showcase.service';

/**
 * 管理员项目审核 API 集成测试
 *
 * 测试管理员审核待审核项目的完整流程:
 * - 获取待审核项目列表
 * - 获取待审核项目数量
 * - 批准项目
 * - 拒绝项目
 */
describe('管理员项目审核 API 集成测试', () => {
  let fixture: ApiIntegrationFixture;
  let adminService: AdminService;
  let adminController: AdminController;

  const mockPendingProjects = [
    {
      id: 'proj-pending-1',
      repositoryName: 'test-pending-project',
      description: 'Test pending project description',
      owner: 'testowner',
      stars: 100,
      language: 'TypeScript',
      topics: ['test'],
      category: 'WEB_APP',
      suggestedTags: ['测试'],
      screenshotUrl: null,
      githubUrl: 'https://github.com/test-review/pending-project',
      status: ProjectStatus.PENDING,
      submittedBy: 'user1',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      submittedByUser: {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  ];

  beforeAll(async () => {
    fixture = await createApiFixture();
    adminService = fixture.adminService;
    adminController = fixture.adminController;
  });

  afterAll(async () => {
    await fixture.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('[P0] GET /api/v1/admin/showcase/pending - 获取待审核项目列表', () => {
    it('[P0] 管理员应能获取待审核项目列表', async () => {
      // Mock the service response
      jest.spyOn(adminService, 'getPendingProjects').mockResolvedValue({
        items: mockPendingProjects.map(p => ({
          ...p,
          submittedBy: p.submittedByUser,
        })),
        meta: {
          total: 1,
          page: 1,
          pageSize: 12,
          totalPages: 1,
        },
      });

      const result = await adminController.getPendingProjects({
        page: 1,
        pageSize: 12,
      });

      expect(result).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining('成功'),
      });
      expect(result.data).toHaveProperty('items');
      expect(result.data).toHaveProperty('meta');
      expect(Array.isArray(result.data.items)).toBeTruthy();
    });

    it('[P0] 空列表应返回正确结构', async () => {
      jest.spyOn(adminService, 'getPendingProjects').mockResolvedValue({
        items: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: 12,
          totalPages: 0,
        },
      });

      const result = await adminController.getPendingProjects({
        page: 1,
        pageSize: 12,
      });

      expect(result.data.items).toEqual([]);
      expect(result.data.meta.total).toBe(0);
    });
  });

  describe('[P1] GET /api/v1/admin/showcase/pending/count - 获取待审核数量', () => {
    it('[P1] 管理员应能获取待审核项目数量', async () => {
      jest.spyOn(adminService, 'getPendingProjectsCount').mockResolvedValue(5);

      const result = await adminController.getPendingProjectsCount();

      expect(result.data).toHaveProperty('count');
      expect(result.data.count).toBe(5);
    });

    it('[P1] 没有待审核项目时应返回 0', async () => {
      jest.spyOn(adminService, 'getPendingProjectsCount').mockResolvedValue(0);

      const result = await adminController.getPendingProjectsCount();

      expect(result.data.count).toBe(0);
    });
  });

  describe('[P0] PUT /api/v1/admin/showcase/:id/approve - 批准项目', () => {
    it('[P0] 管理员应能批准待审核项目', async () => {
      const approvedProject = {
        ...mockPendingProjects[0],
        status: ProjectStatus.APPROVED,
        reviewedBy: 'admin1',
        reviewedAt: new Date().toISOString(),
      };

      jest.spyOn(adminService, 'approveProject').mockResolvedValue(approvedProject as any);

      const result = await adminController.approveProject('proj-pending-1', {
        user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
      } as any);

      expect(result).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining('批准'),
      });
      expect(result.data).toHaveProperty('id');
    });

    it('[P0] 批准不存在的项目应返回 404', async () => {
      jest.spyOn(adminService, 'approveProject').mockImplementation(() => {
        throw new Error('Project not found');
      });

      await expect(
        adminController.approveProject('nonexistent-id', {
          user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
        } as any)
      ).rejects.toThrow();
    });

    it('[P2] 批准已批准的项目应返回 400', async () => {
      jest.spyOn(adminService, 'approveProject').mockImplementation(() => {
        throw new Error('Project is not in PENDING status');
      });

      await expect(
        adminController.approveProject('proj-pending-1', {
          user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('[P0] PUT /api/v1/admin/showcase/:id/reject - 拒绝项目', () => {
    it('[P0] 管理员应能拒绝待审核项目', async () => {
      const rejectedProject = {
        ...mockPendingProjects[0],
        status: ProjectStatus.REJECTED,
        reviewedBy: 'admin1',
        reviewedAt: new Date().toISOString(),
        rejectionReason: '项目描述不完整',
      };

      jest.spyOn(adminService, 'rejectProject').mockResolvedValue(rejectedProject as any);

      const result = await adminController.rejectProject(
        'proj-pending-1',
        { rejectionReason: '项目描述不完整' },
        {
          user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
        } as any
      );

      expect(result).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining('拒绝'),
      });
      expect(result.data).toHaveProperty('id');
    });

    it('[P0] 拒绝项目时必须提供原因', async () => {
      jest.spyOn(adminService, 'rejectProject').mockImplementation(() => {
        throw new Error('Rejection reason is required');
      });

      await expect(
        adminController.rejectProject(
          'proj-pending-1',
          { rejectionReason: '' },
          {
            user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
          } as any
        )
      ).rejects.toThrow();
    });

    it('[P0] 拒绝原因少于5个字符应返回验证错误', async () => {
      jest.spyOn(adminService, 'rejectProject').mockImplementation(() => {
        throw new Error('Rejection reason must be at least 5 characters');
      });

      await expect(
        adminController.rejectProject(
          'proj-pending-1',
          { rejectionReason: 'abc' },
          {
            user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
          } as any
        )
      ).rejects.toThrow();
    });

    it('[P1] 拒绝不存在的项目应返回 404', async () => {
      jest.spyOn(adminService, 'rejectProject').mockImplementation(() => {
        throw new Error('Project not found');
      });

      await expect(
        adminController.rejectProject(
          'nonexistent-id',
          { rejectionReason: '测试拒绝原因' },
          {
            user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
          } as any
        )
      ).rejects.toThrow();
    });

    it('[P2] 拒绝原因可以很长', async () => {
      const longReason = 'a'.repeat(500);
      const rejectedProject = {
        ...mockPendingProjects[0],
        status: ProjectStatus.REJECTED,
        reviewedBy: 'admin1',
        reviewedAt: new Date().toISOString(),
        rejectionReason: longReason,
      };

      jest.spyOn(adminService, 'rejectProject').mockResolvedValue(rejectedProject as any);

      const result = await adminController.rejectProject(
        'proj-pending-1',
        { rejectionReason: longReason },
        {
          user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
        } as any
      );

      expect(result.statusCode).toBe(200);
    });
  });

  describe('[P2] 边界情况', () => {
    it('[P2] 无效的项目 ID 格式应返回适当错误', async () => {
      jest.spyOn(adminService, 'approveProject').mockImplementation(() => {
        throw new Error('Invalid project ID');
      });

      await expect(
        adminController.approveProject('invalid-id', {
          user: { id: 'admin1', email: 'admin@test.com', role: Role.ADMIN },
        } as any)
      ).rejects.toThrow();
    });

    it('[P2] 分页超过范围应返回空列表', async () => {
      jest.spyOn(adminService, 'getPendingProjects').mockResolvedValue({
        items: [],
        meta: {
          total: 5,
          page: 100,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const result = await adminController.getPendingProjects({
        page: 100,
        pageSize: 10,
      });

      expect(result.data.items).toEqual([]);
    });
  });
});
