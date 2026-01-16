import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { CurrentUserData } from '../common/decorators';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockUser: CurrentUserData = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  const mockFullUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return current user data with correct structure', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual({
        statusCode: 200,
        message: '获取当前用户信息成功',
        data: mockFullUser,
      });
    });

    it('should call usersService.getCurrentUser with userId from decorator', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      await controller.getCurrentUser(mockUser);

      expect(service.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(service.getCurrentUser).toHaveBeenCalledWith('user-123');
    });

    it('should return 200 status code in response body', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      const result = await controller.getCurrentUser(mockUser);

      expect(result.statusCode).toBe(200);
    });

    it('should include success message in response', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      const result = await controller.getCurrentUser(mockUser);

      expect(result.message).toBe('获取当前用户信息成功');
    });

    it('should include user data in response data field', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      const result = await controller.getCurrentUser(mockUser);

      expect(result.data).toEqual(mockFullUser);
      expect(result.data.id).toBe('user-123');
      expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('updateProfile', () => {
    const updatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Updated Name',
      createdAt: new Date('2025-01-01'),
    };

    it('should update user profile and return success response', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);
      const updateProfileDto: UpdateProfileDto = { name: 'Updated Name' };

      const result = await controller.updateProfile(mockUser, updateProfileDto);

      expect(result).toEqual({
        statusCode: 200,
        message: '更新用户信息成功',
        data: updatedUser,
      });
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', 'Updated Name');
    });

    it('should call usersService.updateProfile with userId from decorator', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);
      const updateProfileDto: UpdateProfileDto = { name: 'Updated Name' };

      await controller.updateProfile(mockUser, updateProfileDto);

      expect(service.updateProfile).toHaveBeenCalledTimes(1);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', 'Updated Name');
    });

    it('should return 200 status code in response body', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);
      const updateProfileDto: UpdateProfileDto = { name: 'Updated Name' };

      const result = await controller.updateProfile(mockUser, updateProfileDto);

      expect(result.statusCode).toBe(200);
    });

    it('should include success message in response', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);
      const updateProfileDto: UpdateProfileDto = { name: 'Updated Name' };

      const result = await controller.updateProfile(mockUser, updateProfileDto);

      expect(result.message).toBe('更新用户信息成功');
    });

    it('should include updated user data in response data field', async () => {
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);
      const updateProfileDto: UpdateProfileDto = { name: 'Updated Name' };

      const result = await controller.updateProfile(mockUser, updateProfileDto);

      expect(result.data).toEqual(updatedUser);
      expect(result.data.name).toBe('Updated Name');
    });

    it('should handle optional name field (undefined)', async () => {
      mockUsersService.updateProfile.mockResolvedValue(mockFullUser);
      const updateProfileDto: UpdateProfileDto = { name: undefined };

      const result = await controller.updateProfile(mockUser, updateProfileDto);

      expect(service.updateProfile).toHaveBeenCalledWith('user-123', undefined);
      expect(result.data.name).toBe('Test User');
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual({
        statusCode: 200,
        message: '获取用户信息成功',
        data: mockFullUser,
      });
    });

    it('should call usersService.getCurrentUser with userId from decorator', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue(mockFullUser);

      await controller.getProfile(mockUser);

      expect(service.getCurrentUser).toHaveBeenCalledWith('user-123');
    });
  });
});
