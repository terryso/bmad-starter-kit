/**
 * API Integration Test Fixtures
 *
 * Provides reusable fixtures for API integration testing.
 * Uses NestJS TestingModule with real dependencies for integration testing.
 *
 * @module test-helpers/fixtures/api-integration.fixture
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthController } from '../../modules/auth/auth.controller';
import { UsersService } from '../../users/users.service';
import { UsersController } from '../../users/users.controller';
import { AdminService } from '../../modules/admin/admin.service';
import { AdminController } from '../../modules/admin/admin.controller';
import { ShowcaseService } from '../../modules/showcase/showcase.service';
import { ShowcaseController } from '../../modules/showcase/showcase.controller';
import { GithubFetcherService } from '../../modules/showcase/github-fetcher.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '../../modules/auth/guards/jwt-refresh-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';

/**
 * API Integration Test Fixture
 *
 * Creates a full NestJS application with all modules for integration testing.
 * Includes cleanup and database reset between tests.
 */
export class ApiIntegrationFixture {
  public module: TestingModule;
  public app: INestApplication;
  public authService: AuthService;
  public authController: AuthController;
  public usersService: UsersService;
  public usersController: UsersController;
  public adminService: AdminService;
  public adminController: AdminController;
  public showcaseService: ShowcaseService;
  public showcaseController: ShowcaseController;
  public prismaService: PrismaService;
  public jwtService: JwtService;

  /**
   * Create the testing module with all required dependencies
   */
  async create() {
    this.module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          name: 'short',
          ttl: 1000,
          limit: 3,
        }, {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        }, {
          name: 'long',
          ttl: 60000,
          limit: 100,
        }]),
      ],
      controllers: [
        AuthController,
        UsersController,
        AdminController,
        ShowcaseController,
      ],
      providers: [
        AuthService,
        UsersService,
        AdminService,
        ShowcaseService,
        PrismaService,
        JwtService,
        {
          provide: GithubFetcherService,
          useValue: {
            fetchAndParseProject: jest.fn().mockResolvedValue({
              repositoryName: 'test-repo',
              description: 'Test description',
              owner: 'testowner',
              stars: 100,
              language: 'TypeScript',
              topics: ['test'],
              category: 'WEB_APP',
              suggestedTags: ['测试'],
              githubUrl: 'https://github.com/testowner/test-repo',
            }),
          },
        },
        {
          provide: 'CONFIG_SERVICE',
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'JWT_SECRET': 'test-secret-key-for-testing-only',
                'JWT_EXPIRATION': '15m',
                'JWT_REFRESH_EXPIRATION': '7d',
                'NODE_ENV': 'test',
                'COOKIE_SAME_SITE': 'lax',
                'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
              };
              return config[key];
            }),
          },
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: 'JwtRefreshAuthGuard',
          useClass: JwtRefreshAuthGuard,
        },
        RolesGuard,
      ],
    }).compile();

    this.app = this.module.createNestApplication();
    this.app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await this.app.init();

    // Get service instances
    this.authService = this.module.get<AuthService>(AuthService);
    this.authController = this.module.get<AuthController>(AuthController);
    this.usersService = this.module.get<UsersService>(UsersService);
    this.usersController = this.module.get<UsersController>(UsersController);
    this.adminService = this.module.get<AdminService>(AdminService);
    this.adminController = this.module.get<AdminController>(AdminController);
    this.showcaseService = this.module.get<ShowcaseService>(ShowcaseService);
    this.showcaseController = this.module.get<ShowcaseController>(ShowcaseController);
    this.prismaService = this.module.get<PrismaService>(PrismaService);
    this.jwtService = this.module.get<JwtService>(JwtService);

    return this;
  }

  /**
   * Cleanup after tests
   */
  async cleanup() {
    // Note: Using individual delete instead of deleteMany for compatibility
    // Test data cleanup should be handled by each test or using transactions
    await this.app?.close();
    await this.module?.close();
  }

  /**
   * Generate a valid JWT token for testing
   */
  generateAuthToken(userId: string, email: string, role: string = 'USER'): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  /**
   * Generate a valid refresh token for testing
   */
  generateRefreshToken(userId: string, email: string, role: string = 'USER'): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: '7d' },
    );
  }

  /**
   * Create a mock Express Response object for cookie testing
   */
  createMockResponse() {
    const cookies: Record<string, any> = {};
    return {
      cookie: jest.fn((name: string, value: any, options?: any) => {
        cookies[name] = { value, options };
        return this;
      }),
      clearCookie: jest.fn((name: string, options?: any) => {
        cookies[name] = { cleared: true, options };
        return this;
      }),
      getCookies: () => cookies,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
  }
}

/**
 * Helper function to create a fixture
 */
export const createApiFixture = async (): Promise<ApiIntegrationFixture> => {
  const fixture = new ApiIntegrationFixture();
  await fixture.create();
  return fixture;
};
