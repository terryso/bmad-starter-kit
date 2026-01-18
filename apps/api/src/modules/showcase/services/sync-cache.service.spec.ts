import { Test, TestingModule } from '@nestjs/testing';
import { SyncCacheService } from './sync-cache.service';

describe('SyncCacheService', () => {
  let service: SyncCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncCacheService],
    }).compile();

    service = module.get<SyncCacheService>(SyncCacheService);
  });

  afterEach(() => {
    // 清理缓存以确保测试隔离
    service.clearAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('初始状态', () => {
    it('首次同步应该被允许', () => {
      const result = service.canSync('user-1', 'project-1');
      expect(result).toBe(true);
    });

    it('首次同步应该返回 null 作为最后同步时间', () => {
      const result = service.getLastSyncAttempt('user-1', 'project-1');
      expect(result).toBe(null);
    });

    it('首次同步应该返回 0 作为剩余冷却时间', () => {
      const result = service.getRemainingCooldown('user-1', 'project-1');
      expect(result).toBe(0);
    });
  });

  describe('记录同步尝试', () => {
    it('应该正确记录同步尝试时间', () => {
      const beforeTime = Date.now();
      service.setSyncAttempt('user-1', 'project-1');
      const afterTime = Date.now();

      const lastAttempt = service.getLastSyncAttempt('user-1', 'project-1');
      expect(lastAttempt).toBeGreaterThanOrEqual(beforeTime);
      expect(lastAttempt).toBeLessThanOrEqual(afterTime);
    });

    it('不同用户-项目组合应该有独立的缓存', () => {
      service.setSyncAttempt('user-1', 'project-1');
      service.setSyncAttempt('user-2', 'project-1');
      service.setSyncAttempt('user-1', 'project-2');

      expect(service.getLastSyncAttempt('user-1', 'project-1')).not.toBe(null);
      expect(service.getLastSyncAttempt('user-2', 'project-1')).not.toBe(null);
      expect(service.getLastSyncAttempt('user-1', 'project-2')).not.toBe(null);
      expect(service.getLastSyncAttempt('user-2', 'project-2')).toBe(null);
    });
  });

  describe('速率限制检查', () => {
    it('同步后应该立即进入冷却期', () => {
      service.setSyncAttempt('user-1', 'project-1');
      const result = service.canSync('user-1', 'project-1');
      expect(result).toBe(false);
    });

    it('冷却期应该为 5 分钟', () => {
      service.setSyncAttempt('user-1', 'project-1');
      const remaining = service.getRemainingCooldown('user-1', 'project-1');

      // 应该接近 5 分钟（300,000 毫秒）
      expect(remaining).toBeGreaterThan(290000); // 允许 10 秒误差
      expect(remaining).toBeLessThanOrEqual(300000);
    });

    it('冷却期过后应该允许再次同步', () => {
      service.setSyncAttempt('user-1', 'project-1');

      // 模拟时间流逝超过 5 分钟
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

      const result = service.canSync('user-1', 'project-1');
      expect(result).toBe(true);
    });
  });

  describe('清除缓存', () => {
    it('应该能够清除特定项目的缓存', () => {
      service.setSyncAttempt('user-1', 'project-1');
      expect(service.canSync('user-1', 'project-1')).toBe(false);

      service.clearSyncAttempt('user-1', 'project-1');
      expect(service.canSync('user-1', 'project-1')).toBe(true);
    });

    it('应该能够清除所有缓存', () => {
      service.setSyncAttempt('user-1', 'project-1');
      service.setSyncAttempt('user-2', 'project-2');
      expect(service.getCacheSize()).toBe(2);

      service.clearAll();
      expect(service.getCacheSize()).toBe(0);
    });
  });

  describe('缓存大小', () => {
    it('应该正确报告缓存大小', () => {
      expect(service.getCacheSize()).toBe(0);

      service.setSyncAttempt('user-1', 'project-1');
      expect(service.getCacheSize()).toBe(1);

      service.setSyncAttempt('user-2', 'project-1');
      expect(service.getCacheSize()).toBe(2);

      // 重复的键应该只占用一个位置
      service.setSyncAttempt('user-1', 'project-1');
      expect(service.getCacheSize()).toBe(2);
    });
  });
});
