import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date('2025-01-01'),
    };

    it('should return user without password when user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2025-01-01'),
      });
      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('nonexistent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getUserById('nonexistent')).rejects.toThrow(
        '用户不存在'
      );
    });

    it('should call prisma.user.findUnique with correct parameters', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await service.getUserById('user-123');

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });

  describe('getCurrentUser', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date('2025-01-01'),
    };

    it('should call getUserById with provided userId', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await service.getCurrentUser('user-123');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return the same result as getUserById', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2025-01-01'),
      });
    });
  });

  describe('updateProfile', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date('2025-01-01'),
    };

    const updatedMockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'New Name',
      password: 'hashed-password',
      createdAt: new Date('2025-01-01'),
    };

    it('should update user name successfully', async () => {
      mockPrismaService.user.update.mockResolvedValue(updatedMockUser);

      const result = await service.updateProfile('user-123', 'New Name');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'New Name',
        createdAt: new Date('2025-01-01'),
      });
      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'New Name' },
      });
    });

    it('should return current user data when name is undefined', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.updateProfile('user-123', undefined);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2025-01-01'),
      });
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw BadRequestException when name is empty string', async () => {
      await expect(service.updateProfile('user-123', '')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateProfile('user-123', '')).rejects.toThrow(
        '姓名不能为空'
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when name is only whitespace', async () => {
      await expect(service.updateProfile('user-123', '   ')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateProfile('user-123', '   ')).rejects.toThrow(
        '姓名不能为空'
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should handle name with leading/trailing spaces', async () => {
      const trimmedUser = { ...updatedMockUser, name: 'Trimmed Name' };
      mockPrismaService.user.update.mockResolvedValue(trimmedUser);

      const result = await service.updateProfile('user-123', '  Trimmed Name  ');

      // Note: The service does not trim the name, it passes it as-is
      // This test documents current behavior
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: '  Trimmed Name  ' },
      });
    });

    it('should exclude password from update response', async () => {
      mockPrismaService.user.update.mockResolvedValue(updatedMockUser);

      const result = await service.updateProfile('user-123', 'New Name');

      expect(result).not.toHaveProperty('password');
    });
  });
});
