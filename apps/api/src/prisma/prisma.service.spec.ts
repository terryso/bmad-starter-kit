import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

/**
 * Unit tests for PrismaService
 * Note: These tests mock database connections to avoid network calls.
 * Real database connection tests should be in E2E tests.
 */
describe('PrismaService', () => {
  let service: PrismaService;
  let connectSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock database methods to avoid real connections
    connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
  });

  describe('Prisma Models', () => {
    it('should have user model available', () => {
      expect(service.user).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('should call $connect on module initialization', async () => {
      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors gracefully', async () => {
      connectSpy.mockRejectedValueOnce(new Error('Connection failed'));

      // Should not throw, allows app to start in degraded mode
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect on module destruction', async () => {
      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect errors gracefully', async () => {
      disconnectSpy.mockRejectedValueOnce(new Error('Disconnect failed'));

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });
});
