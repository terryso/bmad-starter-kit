import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { User, Role } from '@prisma/client';

// Type for mocked AuthService
type MockAuthService = {
  register: jest.Mock;
  login: jest.Mock;
  logout: jest.Mock;
  findByEmail: jest.Mock;
  comparePassword: jest.Mock;
  refreshTokens: jest.Mock;
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: MockAuthService;

  const mockUser: Omit<User, 'password'> = {
    id: 'cmjsq04gj0000lwkitfljctu2',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date('2025-12-30T00:00:00.000Z'),
  };

  const createMockAuthService = (): MockAuthService => ({
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    findByEmail: jest.fn(),
    comparePassword: jest.fn(),
    refreshTokens: jest.fn(),
  });

  beforeEach(async () => {
    const mockAuth = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuth,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(JwtRefreshAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = mockAuth;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validDto: RegisterDto = {
      email: 'test@example.com',
      password: '12345678',
      name: 'Test User',
    };

    it('should return 201 and user data on successful registration', async () => {
      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(validDto);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: '注册成功',
        data: mockUser,
      });

      expect(authService.register).toHaveBeenCalledWith(
        validDto.email,
        validDto.password,
        validDto.name,
        undefined,
        undefined,
      );
    });

    it('should exclude password from response', async () => {
      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(validDto);

      expect(result.data).not.toHaveProperty('password');
      expect(authService.register).toHaveBeenCalledWith(
        validDto.email,
        validDto.password,
        validDto.name,
        undefined,
        undefined,
      );
    });

    it('should propagate ConflictException from service', async () => {
      const { ConflictException } = await import('@nestjs/common');
      authService.register.mockRejectedValue(
        new ConflictException('该邮箱已被注册'),
      );

      await expect(controller.register(validDto)).rejects.toThrow(ConflictException);
      await expect(controller.register(validDto)).rejects.toThrow('该邮箱已被注册');
    });

    it('should call service with correct parameters', async () => {
      authService.register.mockResolvedValue(mockUser);

      await controller.register(validDto);

      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(
        'test@example.com',
        '12345678',
        'Test User',
        undefined,
        undefined,
      );
    });
  });

  describe('logout', () => {
    // Mock Response object with clearCookie method
    const mockResponse = {
      clearCookie: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    const mockUser = {
      sub: 'cmjsq04gj0000lwkitfljctu2',
      email: 'test@example.com',
      role: 'USER' as const,
    };

    it('should return 200 and success message on logout', async () => {
      authService.logout.mockResolvedValue({ message: '登出成功' });

      const result = await controller.logout(mockUser, mockResponse);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: '登出成功',
        data: { message: '登出成功' },
      });

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should clear the refresh_token cookie with all required parameters', async () => {
      authService.logout.mockResolvedValue({ message: '登出成功' });

      await controller.logout(mockUser, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
    });

    it('should call authService.logout', async () => {
      authService.logout.mockResolvedValue({ message: '登出成功' });

      await controller.logout(mockUser, mockResponse);

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should clear cookie with sameSite parameter', async () => {
      authService.logout.mockResolvedValue({ message: '登出成功' });

      await controller.logout(mockUser, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          sameSite: expect.any(String),
        }),
      );
    });
  });

  describe('refresh', () => {
    const mockUser = {
      userId: 'cmjsq04gj0000lwkitfljctu2',
      email: 'test@example.com',
    };

    const refreshResult = {
      accessToken: 'new-access-token',
      user: mockUser,
    };

    it('should return 200 and new access token on successful refresh', async () => {
      authService.refreshTokens.mockResolvedValue(refreshResult);

      const result = await controller.refresh(mockUser);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: '刷新成功',
        data: refreshResult,
      });

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        mockUser.userId,
        mockUser.email,
      );
    });

    it('should call refreshTokens with correct parameters', async () => {
      authService.refreshTokens.mockResolvedValue(refreshResult);

      await controller.refresh(mockUser);

      expect(authService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'cmjsq04gj0000lwkitfljctu2',
        'test@example.com',
      );
    });

    it('should propagate UnauthorizedException from service', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      authService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('无效的刷新令牌'),
      );

      await expect(controller.refresh(mockUser)).rejects.toThrow(UnauthorizedException);
      await expect(controller.refresh(mockUser)).rejects.toThrow('无效的刷新令牌');
    });
  });
});
