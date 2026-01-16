import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role } from '@prisma/client';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

// Type for mocked PrismaService
type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  $connect: jest.Mock;
  $disconnect: jest.Mock;
};

// Type for mocked JwtService
type MockJwtService = {
  signAsync: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: MockJwtService;

  // Mock user data
  const mockUser: User = {
    id: 'cmjsq04gj0000lwkitfljctu2',
    email: 'test@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz', // mocked hash
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date('2025-12-30T00:00:00.000Z'),
  };

  const createMockPrismaService = (): MockPrismaService => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  });

  const createMockJwtService = (): MockJwtService => ({
    signAsync: jest.fn(),
  });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const mockJwt = createMockJwtService();

    // Reset bcrypt mocks before each test
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwt,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = mockPrisma;
    jwtService = mockJwt;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: '12345678',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      // Mock: user doesn't exist
      prismaService.user.findUnique.mockResolvedValue(null);

      // Mock: create user
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.register(
        registerData.email,
        registerData.password,
        registerData.name,
      );

      // Verify user existence check
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });

      // Verify password was hashed with salt rounds = 10
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);

      // Verify user creation
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerData.email,
          password: '$2b$10$hashedpassword',
          name: registerData.name,
        },
      });

      // Verify password is not returned
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Mock: user exists
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register(registerData.email, registerData.password, registerData.name),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.register(registerData.email, registerData.password, registerData.name),
      ).rejects.toThrow('该邮箱已被注册');

      // Verify user existence check was called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });

      // Verify user creation was NOT called
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with correct salt rounds', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);

      await service.register(registerData.email, registerData.password, registerData.name);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = '12345678';

    it('should return user without password when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).not.toHaveProperty('password');
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = '12345678';

    it('should successfully login with valid credentials', async () => {
      const userWithoutPassword: Omit<User, 'password'> = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      };

      // Mock validateUser (implicitly) - findUnique and bcrypt.compare
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Mock JWT token generation
      jwtService.signAsync.mockResolvedValueOnce('mock-access-token');
      jwtService.signAsync.mockResolvedValueOnce('mock-refresh-token');

      const result = await service.login(email, password);

      // Verify tokens were generated
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: '1h' },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: '7d' },
      );

      // Verify result structure
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: userWithoutPassword,
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(email, password)).rejects.toThrow('邮箱或密码错误');

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(email, password)).rejects.toThrow('邮箱或密码错误');

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when email does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const result = await service.comparePassword('password123', 'hashed');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword('wrongpassword', 'hashed');

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed');
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await service.logout();

      expect(result).toEqual({ message: '登出成功' });
    });

    it('should not throw any errors', async () => {
      await expect(service.logout()).resolves.toBeDefined();
    });
  });
});
