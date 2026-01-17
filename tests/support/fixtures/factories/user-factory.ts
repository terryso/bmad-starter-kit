/**
 * 用户数据工厂
 *
 * 使用 @faker-js/faker 生成随机测试数据
 * 支持数据覆盖和自动清理
 *
 * 知识库参考: testarch/knowledge/data-factories.md
 */

import { faker } from '@faker-js/faker';
// 设置中文 locale
import '@faker-js/faker/locale/zh_CN';

/**
 * 用户数据类型
 */
export interface UserData {
  id?: string;
  email: string;
  password: string;
  name: string;
  role?: string;
}

/**
 * 用户工厂类
 *
 * 负责创建测试用户并在测试后自动清理
 */
export class UserFactory {
  private createdUsers: string[] = [];

  /**
   * 创建单个用户
   *
   * @param overrides - 覆盖默认生成的数据
   * @returns 用户数据
   */
  createUser(overrides: Partial<UserData> = {}): UserData {
    const user: UserData = {
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 12, memorable: true }),
      name: faker.person.fullName(),
      role: 'user',
      ...overrides,
    };

    // 记录创建的用户 ID (用于清理)
    if (user.id) {
      this.createdUsers.push(user.id);
    }

    return user;
  }

  /**
   * 创建多个用户
   *
   * @param count - 用户数量
   * @param overrides - 覆盖默认生成的数据
   * @returns 用户数据数组
   */
  createUsers(count: number, overrides: Partial<UserData> = {}): UserData[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /**
   * 创建管理员用户
   *
   * @param overrides - 覆盖默认生成的数据
   * @returns 管理员用户数据
   */
  createAdminUser(overrides: Partial<UserData> = {}): UserData {
    return this.createUser({
      role: 'admin',
      ...overrides,
    });
  }

  /**
   * 清理所有创建的用户
   *
   * 注意: 实际清理逻辑需要根据项目 API 实现
   * 这里只是示例，需要替换为真实的 API 调用
   */
  async cleanup(): Promise<void> {
    for (const userId of this.createdUsers) {
      try {
        // TODO: 实现真实的 API 调用来删除用户
        // await fetch(`${process.env.API_URL}/users/${userId}`, {
        //   method: 'DELETE',
        //   headers: {
        //     Authorization: `Bearer ${adminToken}`,
        //   },
        // });
        console.log(`[UserFactory] 清理用户: ${userId}`);
      } catch (error) {
        console.error(`[UserFactory] 清理用户失败: ${userId}`, error);
      }
    }
    this.createdUsers = [];
  }

  /**
   * 通过 API 创建用户 (如果需要真实数据库操作)
   *
   * @param overrides - 覆盖默认生成的数据
   * @returns API 返回的用户数据
   */
  async createUserViaAPI(overrides: Partial<UserData> = {}): Promise<UserData> {
    const userData = this.createUser(overrides);

    try {
      // TODO: 实现真实的 API 调用来创建用户
      // const response = await fetch(`${process.env.API_URL}/users`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     email: userData.email,
      //     password: userData.password,
      //     name: userData.name,
      //   }),
      // });

      // const createdUser = await response.json();
      // this.createdUsers.push(createdUser.id);
      // return createdUser;

      console.log('[UserFactory] 模拟 API 创建用户:', userData.email);
      return userData;
    } catch (error) {
      console.error('[UserFactory] API 创建用户失败:', error);
      throw error;
    }
  }
}

/**
 * 便捷函数: 创建单个用户
 */
export const createUser = (overrides?: Partial<UserData>) =>
  new UserFactory().createUser(overrides);

/**
 * 便捷函数: 创建多个用户
 */
export const createUsers = (count: number, overrides?: Partial<UserData>) =>
  new UserFactory().createUsers(count, overrides);

/**
 * 便捷函数: 创建管理员用户
 */
export const createAdminUser = (overrides?: Partial<UserData>) =>
  new UserFactory().createAdminUser(overrides);
