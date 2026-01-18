import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { UsersQueryDto } from './dto/users-query.dto';

// Type for mocked PrismaService
type MockPrismaService = {
  user: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  project: {
    count: jest.Mock;
    aggregate: jest.Mock;
  };
};

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: MockPrismaService;

  // Mock user data
  const mockUsers = [
    {
      id: 'user1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    },
    {
      id: 'user2',
      email: 'user@example.com',
      name: 'Regular User',
      role: Role.USER,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
    },
  ];

  const createMockPrismaService = (): MockPrismaService => ({
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    project: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

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
    prismaService = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    const mockCurrentUserId = 'admin-id';

    it('should return paginated users list', async () => {
      prismaService.user.findMany.mockResolvedValue(mockUsers);
      prismaService.user.count.mockResolvedValue(2);

      const query: UsersQueryDto = { page: 1, pageSize: 20 };
      const result = await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        }),
      );

      expect(prismaService.user.count).toHaveBeenCalledWith({ where: {} });

      expect(result).toEqual({
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
      });
    });

    it('should filter by role when role param is provided', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      prismaService.user.count.mockResolvedValue(1);

      const query: UsersQueryDto = { page: 1, pageSize: 20, role: Role.ADMIN };
      await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: Role.ADMIN },
        }),
      );

      expect(prismaService.user.count).toHaveBeenCalledWith({ where: { role: Role.ADMIN } });
    });

    it('should search by email when search param is provided', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      prismaService.user.count.mockResolvedValue(1);

      const query: UsersQueryDto = { page: 1, pageSize: 20, search: 'admin' };
      await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: {
              contains: 'admin',
              mode: 'insensitive',
            },
          },
        }),
      );

      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: {
          email: {
            contains: 'admin',
            mode: 'insensitive',
          },
        },
      });
    });

    it('should combine search and role filters', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      prismaService.user.count.mockResolvedValue(1);

      const query: UsersQueryDto = {
        page: 1,
        pageSize: 20,
        search: 'admin',
        role: Role.ADMIN,
      };
      await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            email: {
              contains: 'admin',
              mode: 'insensitive',
            },
            role: Role.ADMIN,
          },
        }),
      );
    });

    it('should limit pageSize to MAX_PAGE_SIZE (100)', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      const query: UsersQueryDto = { page: 1, pageSize: 999 };
      await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Limited to MAX_PAGE_SIZE
        }),
      );
    });

    it('should use default pagination when params not provided', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      const query: UsersQueryDto = {};
      await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should calculate skip correctly for page > 1', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      const query: UsersQueryDto = { page: 3, pageSize: 10 };
      await service.findAllUsers(query, mockCurrentUserId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3 - 1) * 10
          take: 10,
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(45);

      const query: UsersQueryDto = { page: 1, pageSize: 20 };
      const result = await service.findAllUsers(query, mockCurrentUserId);

      expect(result.pagination.totalPages).toBe(3); // Math.ceil(45 / 20) = 3
    });

    it('should return empty array when no users found', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      const query: UsersQueryDto = { page: 1, pageSize: 20 };
      const result = await service.findAllUsers(query, mockCurrentUserId);

      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should set lastActiveAt to null for all users', async () => {
      prismaService.user.findMany.mockResolvedValue(mockUsers);
      prismaService.user.count.mockResolvedValue(2);

      const query: UsersQueryDto = { page: 1, pageSize: 20 };
      const result = await service.findAllUsers(query, mockCurrentUserId);

      expect(result.users[0].lastActiveAt).toBeNull();
      expect(result.users[1].lastActiveAt).toBeNull();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      // Setup default mock return values
      prismaService.user.count.mockResolvedValue(42);
      prismaService.project.count.mockResolvedValue(10);
      prismaService.project.aggregate.mockResolvedValue({ _sum: { stars: 123 } });
    });

    it('should return aggregated statistics', async () => {
      // Setup mock return values in the correct order for Promise.all
      prismaService.user.count
        .mockResolvedValueOnce(42) // totalUsers
        .mockResolvedValueOnce(3) // newUsersToday
        .mockResolvedValueOnce(18); // newUsersThisMonth
      prismaService.project.count
        .mockResolvedValueOnce(10) // totalProjects
        .mockResolvedValueOnce(2) // pendingProjects
        .mockResolvedValueOnce(1); // newProjectsToday
      prismaService.project.aggregate.mockResolvedValue({ _sum: { stars: 123 } });

      const result = await service.getStats();

      expect(result).toEqual({
        totalUsers: 42,
        newUsersToday: 3,
        newUsersThisMonth: 18,
        totalProjects: 10,
        pendingProjects: 2,
        totalStars: 123,
        newProjectsToday: 1,
      });
    });

    it('should return zeros for empty database', async () => {
      prismaService.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaService.project.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaService.project.aggregate.mockResolvedValue({ _sum: { stars: null } });

      const result = await service.getStats();

      expect(result).toEqual({
        totalUsers: 0,
        newUsersToday: 0,
        newUsersThisMonth: 0,
        totalProjects: 0,
        pendingProjects: 0,
        totalStars: 0,
        newProjectsToday: 0,
      });
    });

    it('should use parallel queries (Promise.all)', async () => {
      prismaService.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(50);
      prismaService.project.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      prismaService.project.aggregate.mockResolvedValue({ _sum: { stars: 500 } });

      await service.getStats();

      // Verify all queries were called
      expect(prismaService.user.count).toHaveBeenCalledTimes(3);
      expect(prismaService.project.count).toHaveBeenCalledTimes(3);
      expect(prismaService.project.aggregate).toHaveBeenCalledTimes(1);
    });

    it('should calculate today start correctly for "today" stats', async () => {
      prismaService.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(50);
      prismaService.project.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      prismaService.project.aggregate.mockResolvedValue({ _sum: { stars: 500 } });

      await service.getStats();

      // The second user.count call is for newUsersToday
      // Verify it includes the date filter
      const newUsersTodayCall = prismaService.user.count.mock.calls[1];
      expect(newUsersTodayCall).toBeDefined();
      expect(newUsersTodayCall[0]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should calculate month start correctly for "this month" stats', async () => {
      prismaService.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(50);
      prismaService.project.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      prismaService.project.aggregate.mockResolvedValue({ _sum: { stars: 500 } });

      await service.getStats();

      // The third user.count call is for newUsersThisMonth
      // Verify it includes the month filter
      const activeUsersCall = prismaService.user.count.mock.calls[2];
      expect(activeUsersCall).toBeDefined();
      expect(activeUsersCall[0]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
