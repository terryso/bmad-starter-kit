import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersQueryDto } from './dto/users-query.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<Pick<AdminService, 'findAllUsers' | 'getStats'>>;

  const mockUsersListResponse = {
    users: [
      {
        id: 'user1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.ADMIN,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        lastActiveAt: null,
      },
      {
        id: 'user2',
        email: 'user@example.com',
        name: 'Regular User',
        role: Role.USER,
        createdAt: new Date('2024-01-02T00:00:00.000Z'),
        lastActiveAt: null,
      },
    ],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const mockAdminService = {
      findAllUsers: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = mockAdminService as jest.Mocked<Pick<AdminService, 'findAllUsers' | 'getStats'>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return paginated users list', async () => {
      service.findAllUsers.mockResolvedValue(mockUsersListResponse);

      const query: UsersQueryDto = { page: 1, pageSize: 20 };
      const mockCurrentUserId = 'test-admin-id';
      // Pass page and pageSize as separate string arguments to trigger pagination format
      const result = await controller.findAllUsers(query, mockCurrentUserId, '1', '20');

      expect(service.findAllUsers).toHaveBeenCalledWith(query, mockCurrentUserId);
      expect(result).toEqual({
        data: {
          items: mockUsersListResponse.users,
          total: mockUsersListResponse.pagination.total,
          page: mockUsersListResponse.pagination.page,
          limit: mockUsersListResponse.pagination.pageSize,
          totalPages: mockUsersListResponse.pagination.totalPages,
        },
        statusCode: 200,
        message: 'success',
      });
    });

    it('should call service with default values when query is empty', async () => {
      service.findAllUsers.mockResolvedValue(mockUsersListResponse);

      const query: UsersQueryDto = {};
      const mockCurrentUserId = 'test-admin-id';
      await controller.findAllUsers(query, mockCurrentUserId);

      // The DTO passes through the query object as-is; defaults are applied in the service
      expect(service.findAllUsers).toHaveBeenCalledWith(query, mockCurrentUserId);
    });

    it('should pass search and role filters to service', async () => {
      service.findAllUsers.mockResolvedValue(mockUsersListResponse);

      const query: UsersQueryDto = {
        page: 1,
        pageSize: 20,
        search: 'admin',
        role: Role.ADMIN,
      };
      const mockCurrentUserId = 'test-admin-id';
      await controller.findAllUsers(query, mockCurrentUserId, '1', '20');

      expect(service.findAllUsers).toHaveBeenCalledWith(query, mockCurrentUserId);
    });

    it('should pass pagination params to service', async () => {
      service.findAllUsers.mockResolvedValue(mockUsersListResponse);

      const query: UsersQueryDto = { page: 2, pageSize: 50 };
      const mockCurrentUserId = 'test-admin-id';
      await controller.findAllUsers(query, mockCurrentUserId, '2', '50');

      expect(service.findAllUsers).toHaveBeenCalledWith(query, mockCurrentUserId);
    });
  });

  describe('getStats', () => {
    const mockStatsData = {
      totalUsers: 42,
      newUsersToday: 3,
      newUsersThisMonth: 18,
      totalProjects: 10,
    };

    const expectedResponse = {
      data: mockStatsData,
      statusCode: 200,
      message: 'success',
    };

    it('should return system statistics with standard response format', async () => {
      service.getStats.mockResolvedValue(mockStatsData);

      const result = await controller.getStats();

      expect(service.getStats).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should return zero values for empty database', async () => {
      const emptyStats = {
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisMonth: 0,
        totalProjects: 0,
      };

      service.getStats.mockResolvedValue(emptyStats);

      const result = await controller.getStats();

      expect(result).toEqual({
        data: emptyStats,
        statusCode: 200,
        message: 'success',
      });
    });

    it('should call service getStats method', async () => {
      service.getStats.mockResolvedValue(mockStatsData);

      await controller.getStats();

      expect(service.getStats).toHaveBeenCalledTimes(1);
      expect(service.getStats).toHaveBeenCalledWith();
    });

    it('should return correct response structure', async () => {
      service.getStats.mockResolvedValue(mockStatsData);

      const result = await controller.getStats();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('message');
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(mockStatsData);
    });
  });
});
