/**
 * ProjectCard 组件测试
 *
 * 测试项目展示卡片组件的渲染和交互
 * 采用 Given-When-Then 格式
 *
 * 知识库参考:
 * - component-tdd.md (组件 TDD 循环)
 * - test-priorities-matrix.md (P2 优先级 - UI 组件)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectCard } from './ProjectCard';
import type { Project } from '@bmad-starter-kit/shared';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </MemoryRouter>
  );
};

describe('ProjectCard', () => {
  // 测试数据工厂
  const createMockProject = (overrides: Partial<Project> = {}): Project => ({
    id: '1',
    repositoryName: 'awesome-project',
    description: 'An awesome project for testing',
    owner: 'testuser',
    stars: 1234,
    language: 'TypeScript',
    topics: ['web', 'framework'],
    category: 'WEB_APP',
    suggestedTags: ['开源', '工具'],
    screenshotUrl: null,
    githubUrl: 'https://github.com/testuser/awesome-project',
    createdAt: '2024-01-01T00:00:00.000Z',
    githubUpdatedAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  });

  describe('[P2] 渲染', () => {
    it('[P2] 应渲染项目仓库名称', () => {
      // GIVEN: 一个项目数据
      const project = createMockProject({ repositoryName: 'my-awesome-project' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示项目名称
      expect(screen.getByText('my-awesome-project')).toBeInTheDocument();
    });

    it('[P2] 应渲染项目描述', () => {
      // GIVEN: 一个项目数据
      const project = createMockProject({ description: 'This is a test project description' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示项目描述
      expect(screen.getByText('This is a test project description')).toBeInTheDocument();
    });

    it('[P2] 应渲染编程语言标签', () => {
      // GIVEN: 一个有语言信息的项目
      const project = createMockProject({ language: 'TypeScript' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示语言标签
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('[P2] 应渲染分类标签', () => {
      // GIVEN: 一个 WEB_APP 类型的项目
      const project = createMockProject({ category: 'WEB_APP' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示"Web 应用"分类标签
      expect(screen.getByText('Web 应用')).toBeInTheDocument();
    });

    it('[P2] 应渲染所有者信息', () => {
      // GIVEN: 一个项目数据
      const project = createMockProject({ owner: 'testowner' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示所有者
      expect(screen.getByText('testowner')).toBeInTheDocument();
    });

    it('[P2] 应渲染星标数', () => {
      // GIVEN: 一个有星标的项目
      const project = createMockProject({ stars: 5678 });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示格式化的星标数
      expect(screen.getByText('5,678')).toBeInTheDocument();
    });
  });

  describe('[P2] 边界情况', () => {
    it('[P2] 应处理空描述', () => {
      // GIVEN: 一个没有描述的项目
      const project = createMockProject({ description: '' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示默认文本
      expect(screen.getByText('暂无描述')).toBeInTheDocument();
    });

    it('[P2] 应处理 null 语言', () => {
      // GIVEN: 一个没有语言信息的项目
      const project = createMockProject({ language: null });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应只显示分类标签，不显示语言标签
      expect(screen.queryByTestId('language-badge')).not.toBeInTheDocument();
    });

    it('[P2] 应正确格式化大数字', () => {
      // GIVEN: 一个有大量星标的项目
      const project = createMockProject({ stars: 1234567 });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应显示格式化的数字
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('[P2] 应处理所有分类类型', () => {
      // GIVEN: 各种分类的项目
      const categories: Array<Project['category']> = ['WEB_APP', 'CLI', 'LIBRARY', 'API', 'MOBILE', 'OTHER'];

      categories.forEach((category) => {
        // WHEN: 渲染不同分类的卡片
        const project = createMockProject({ category });
        const { unmount } = renderWithRouter(<ProjectCard project={project} />);

        // THEN: 应显示对应的中文标签
        const categoryLabels: Record<Project['category'], string> = {
          WEB_APP: 'Web 应用',
          CLI: '命令行工具',
          LIBRARY: '库/框架',
          API: 'API 服务',
          MOBILE: '移动应用',
          OTHER: '其他',
        };
        expect(screen.getByText(categoryLabels[category])).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('[P2] 交互', () => {
    it('[P2] 卡片应为可点击链接', () => {
      // GIVEN: 一个项目数据
      const project = createMockProject({ id: 'project-123' });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 应有一个链接到项目详情页
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/showcase/project-123');
    });

    it('[P2] 应有正确的 data-testid 或可识别的选择器', () => {
      // GIVEN: 一个项目数据
      const project = createMockProject();

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 卡片应该能被识别
      const card = screen.getByRole('link');
      expect(card).toBeVisible();
    });
  });

  describe('[P3] 可访问性', () => {
    it('[P3] 链接应有描述性的文本内容', () => {
      // GIVEN: 一个项目数据
      const project = createMockProject({
        repositoryName: 'accessible-project',
        description: 'A project with good accessibility',
      });

      // WHEN: 渲染 ProjectCard
      renderWithRouter(<ProjectCard project={project} />);

      // THEN: 链接应包含有意义的文本
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('accessible-project');
    });
  });
});
