/**
 * 项目数据工厂
 *
 * 用于生成 Showcase 项目测试数据
 * 使用 @faker-js/faker 生成随机测试数据
 *
 * 知识库参考: testarch/knowledge/data-factories.md
 */

import { faker } from '@faker-js/faker';
// 设置中文 locale
import '@faker-js/faker/locale/zh_CN';

/**
 * 项目数据类型
 */
export interface ProjectData {
  githubUrl: string;
  repositoryName: string;
  owner: string;
  description: string;
  stars?: number;
  language?: string | null;
  topics?: string[];
  category?: 'WEB_APP' | 'CLI' | 'LIBRARY' | 'API' | 'MOBILE' | 'OTHER';
  suggestedTags?: string[];
}

/**
 * 项目工厂类
 *
 * 负责创建测试项目数据
 */
export class ProjectFactory {
  /**
   * 有效的 GitHub URL 列表 (用于测试)
   */
  private static readonly VALID_GITHUB_URLS = [
    'https://github.com/facebook/react',
    'https://github.com/vuejs/core',
    'https://github.com/microsoft/typescript',
    'https://github.com/nodejs/node',
    'https://github.com/rust-lang/rust',
  ];

  /**
   * 创建项目数据
   *
   * @param overrides - 覆盖默认生成的数据
   * @returns 项目数据
   */
  createProject(overrides: Partial<ProjectData> = {}): ProjectData {
    const owner = faker.internet.userName();
    const repoName = faker.word.noun() + faker.word.adjective();

    const project: ProjectData = {
      githubUrl: `https://github.com/${owner}/${repoName}`,
      repositoryName: repoName,
      owner: owner,
      description: faker.lorem.sentence({ min: 10, max: 20 }),
      stars: faker.number.int({ min: 0, max: 100000 }),
      language: faker.helpers.arrayElement([
        'TypeScript',
        'JavaScript',
        'Python',
        'Rust',
        'Go',
        'Java',
        null,
      ]),
      topics: faker.helpers.arrayElements([
        'web',
        'framework',
        'library',
        'tools',
        'api',
        'frontend',
        'backend',
      ], { min: 1, max: 5 }),
      category: faker.helpers.arrayElement([
        'WEB_APP',
        'CLI',
        'LIBRARY',
        'API',
        'MOBILE',
        'OTHER',
      ]),
      suggestedTags: faker.helpers.arrayElements([
        '开源',
        '工具',
        '框架',
        '学习资源',
        '实用',
      ], { min: 1, max: 3 }),
      ...overrides,
    };

    return project;
  }

  /**
   * 创建多个项目
   *
   * @param count - 项目数量
   * @param overrides - 覆盖默认生成的数据
   * @returns 项目数据数组
   */
  createProjects(count: number, overrides: Partial<ProjectData> = {}): ProjectData[] {
    return Array.from({ length: count }, () => this.createProject(overrides));
  }

  /**
   * 创建有效的 GitHub URL
   *
   * @returns 有效的 GitHub URL
   */
  createValidGithubUrl(): string {
    return faker.helpers.arrayElement(ProjectFactory.VALID_GITHUB_URLS);
  }

  /**
   * 创建无效的 GitHub URL (用于测试验证)
   *
   * @param type - 无效类型
   * @returns 无效的 URL
   */
  createInvalidGithubUrl(
    type: 'missing' | 'wrong-domain' | 'incomplete' | 'malformed' = 'incomplete'
  ): string {
    switch (type) {
      case 'missing':
        return '';
      case 'wrong-domain':
        return `https://gitlab.com/${faker.internet.userName()}/${faker.word.noun()}`;
      case 'incomplete':
        return 'https://github.com/owner-only';
      case 'malformed':
        return 'not-a-url-at-all';
      default:
        return 'invalid';
    }
  }
}

/**
 * 便捷函数: 创建项目
 */
export const createProject = (overrides?: Partial<ProjectData>) =>
  new ProjectFactory().createProject(overrides);

/**
 * 便捷函数: 创建有效的 GitHub URL
 */
export const createValidGithubUrl = () =>
  new ProjectFactory().createValidGithubUrl();

/**
 * 便捷函数: 创建无效的 GitHub URL
 */
export const createInvalidGithubUrl = (type?: 'missing' | 'wrong-domain' | 'incomplete' | 'malformed') =>
  new ProjectFactory().createInvalidGithubUrl(type);
