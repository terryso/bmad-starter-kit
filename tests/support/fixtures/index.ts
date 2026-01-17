/**
 * 测试 Fixture 架构
 *
 * 采用 mergeTests 组合模式，支持:
 * - 自动清理测试数据
 * - 组合多个 fixture
 * - 类型安全的测试扩展
 *
 * 使用示例:
 * import { test, expect } from '@/tests/support/fixtures';
 */
import { test as base } from '@playwright/test';
import { UserFactory } from './factories/user-factory';

/**
 * 测试 Fixture 类型定义
 */
export type TestFixtures = {
  userFactory: UserFactory;
};

/**
 * 基础测试扩展 - 包含所有通用 fixture
 */
export const test = base.extend<TestFixtures>({
  // 用户数据工厂 - 自动清理创建的用户
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    // 自动清理
    await factory.cleanup();
  },
});

// 导出 expect 以保持一致性
export { expect } from '@playwright/test';
