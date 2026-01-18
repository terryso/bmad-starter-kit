import { Injectable, OnModuleDestroy } from '@nestjs/common';

/**
 * 同步缓存服务 - 内存缓存
 * 用于跟踪用户的同步尝试，实现速率限制
 *
 * @warning 此服务使用内存存储，在以下场景下有局限性：
 * 1. 多实例部署：每个实例有独立的缓存，用户可以通过切换实例绕过限制
 * 2. 服务重启：缓存会完全丢失
 *
 * 生产环境建议使用 Redis 等分布式缓存来替代此实现。
 */
@Injectable()
export class SyncCacheService implements OnModuleDestroy {
  private cache = new Map<string, number>();
  private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5分钟冷却时间
  private readonly MAX_CACHE_SIZE = 10000; // 最大缓存条目数
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1小时清理一次过期条目
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 启动定期清理过期条目的定时器
    this.startCleanupTimer();
  }

  /**
   * 模块销毁时清理定时器
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 启动清理定时器
   * 定期清理过期的缓存条目，防止内存泄漏
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * 清理过期的缓存条目
   * 移除所有超过冷却时间的条目
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, timestamp] of this.cache.entries()) {
      // 如果条目已过期（超过冷却时间 + 10分钟缓冲），则删除
      if (now - timestamp > this.COOLDOWN_MS + 10 * 60 * 1000) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SyncCacheService] Cleaned up ${cleanedCount} expired entries`);
    }
  }

  /**
   * 获取用户上次同步尝试的时间戳
   * @param userId 用户 ID
   * @param projectId 项目 ID
   * @returns 上次同步尝试的时间戳（毫秒），如果不存在则返回 null
   */
  getLastSyncAttempt(userId: string, projectId: string): number | null {
    const key = this.getCacheKey(userId, projectId);
    return this.cache.get(key) || null;
  }

  /**
   * 记录一次成功的同步尝试
   * 失败的同步不应记录，允许用户立即重试
   * @param userId 用户 ID
   * @param projectId 项目 ID
   */
  setSyncAttempt(userId: string, projectId: string): void {
    // 如果缓存已满，先清理过期条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupExpiredEntries();
    }

    const key = this.getCacheKey(userId, projectId);
    this.cache.set(key, Date.now());
  }

  /**
   * 检查用户是否可以对指定项目进行同步
   * @param userId 用户 ID
   * @param projectId 项目 ID
   * @returns 如果可以同步返回 true，否则返回 false
   */
  canSync(userId: string, projectId: string): boolean {
    const lastAttempt = this.getLastSyncAttempt(userId, projectId);
    if (!lastAttempt) return true;
    return Date.now() - lastAttempt > this.COOLDOWN_MS;
  }

  /**
   * 获取距离下次可同步的剩余时间（毫秒）
   * @param userId 用户 ID
   * @param projectId 项目 ID
   * @returns 剩余冷却时间（毫秒），如果可以同步则返回 0
   */
  getRemainingCooldown(userId: string, projectId: string): number {
    const lastAttempt = this.getLastSyncAttempt(userId, projectId);
    if (!lastAttempt) return 0;
    const elapsed = Date.now() - lastAttempt;
    return Math.max(0, this.COOLDOWN_MS - elapsed);
  }

  /**
   * 清除指定项目的同步缓存
   * 用于测试或管理目的
   * @param userId 用户 ID
   * @param projectId 项目 ID
   */
  clearSyncAttempt(userId: string, projectId: string): void {
    const key = this.getCacheKey(userId, projectId);
    this.cache.delete(key);
  }

  /**
   * 生成缓存键
   * @param userId 用户 ID
   * @param projectId 项目 ID
   * @returns 缓存键
   */
  private getCacheKey(userId: string, projectId: string): string {
    return `lastSyncAttempt:${userId}:${projectId}`;
  }

  /**
   * 清除所有缓存
   * 用于测试或重置
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * @returns 当前缓存中的条目数
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
