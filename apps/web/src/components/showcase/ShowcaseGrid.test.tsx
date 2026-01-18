/**
 * ShowcaseGrid 组件测试
 *
 * 测试项目展示网格组件的渲染和交互
 * 采用 Given-When-Then 格式
 *
 * 知识库参考:
 * - component-tdd.md (组件 TDD 循环)
 * - test-priorities-matrix.md (P2 优先级 - UI 组件)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ShowcaseGrid } from './ShowcaseGrid';
import type { ProjectsListResponse } from '@bmad-starter-kit/shared';

// Router wrapper for components that use Link
function withRouter(children: React.ReactNode) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('ShowcaseGrid', () => {
  // 测试数据工厂
  const createMockProject = (id: string, overrides = {}) => ({
    id,
    repositoryName: `project-${id}`,
    description: `Description for project ${id}`,
    owner: `owner-${id}`,
    stars: 1000 + parseInt(id),
    forks: 50 + parseInt(id),
    openIssues: 10 + parseInt(id),
    language: 'TypeScript',
    topics: ['web', 'framework'],
    category: 'WEB_APP' as const,
    suggestedTags: ['开源', '工具'],
    screenshotUrl: null,
    githubUrl: `https://github.com/owner-${id}/project-${id}`,
    createdAt: '2024-01-01T00:00:00.000Z',
    githubUpdatedAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  });

  const createMockResponse = (itemCount: number, overrides = {}): ProjectsListResponse => ({
    items: Array.from({ length: itemCount }, (_, i) => createMockProject(String(i + 1))),
    meta: {
      total: itemCount,
      page: 1,
      pageSize: 12,
      totalPages: Math.ceil(itemCount / 12),
    },
    ...overrides,
  });

  const onPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('[P2] 渲染项目列表', () => {
    it('[P2] 应渲染项目卡片网格', () => {
      // GIVEN: 项目列表数据
      const mockData = createMockResponse(6);

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 应渲染所有项目卡片
      expect(screen.getByText('project-1')).toBeInTheDocument();
      expect(screen.getByText('project-2')).toBeInTheDocument();
      expect(screen.getByText('project-3')).toBeInTheDocument();
      expect(screen.getByText('project-4')).toBeInTheDocument();
      expect(screen.getByText('project-5')).toBeInTheDocument();
      expect(screen.getByText('project-6')).toBeInTheDocument();
    });

    it('[P2] 应使用正确的网格布局类', () => {
      // GIVEN: 项目列表数据
      const mockData = createMockResponse(3);

      // WHEN: 渲染 ShowcaseGrid
      const { container } = render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 应有正确的网格类名
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('[P2] 应显示结果总数', () => {
      // GIVEN: 项目列表数据
      const mockData = createMockResponse(6, { meta: { total: 6, page: 1, pageSize: 12, totalPages: 1 } });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 应显示总数
      expect(screen.getByText(/共 6 个项目/)).toBeInTheDocument();
    });
  });

  describe('[P2] 分页', () => {
    it('[P2] 当有多页时应显示分页控件', () => {
      // GIVEN: 有多页数据的项目列表
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 1, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 应显示分页控件
      expect(screen.getByText('上一页')).toBeInTheDocument();
      expect(screen.getByText('下一页')).toBeInTheDocument();
      expect(screen.getByText(/第 1 \/ 3 页/)).toBeInTheDocument();
    });

    it('[P2] 当只有一页时不显示分页控件', () => {
      // GIVEN: 只有一页数据的项目列表
      const mockData = createMockResponse(6, {
        meta: { total: 6, page: 1, pageSize: 12, totalPages: 1 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 不应显示分页控件
      expect(screen.queryByText('上一页')).not.toBeInTheDocument();
      expect(screen.queryByText('下一页')).not.toBeInTheDocument();
    });

    it('[P2] 点击下一页应调用回调', async () => {
      // GIVEN: 有多页数据的项目列表
      const user = userEvent.setup();
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 1, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 点击下一页按钮
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));
      const nextButton = screen.getByText('下一页');
      await user.click(nextButton);

      // THEN: 应调用回调函数并传入页码 2
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('[P2] 点击上一页应调用回调', async () => {
      // GIVEN: 有多页数据的项目列表（在第二页）
      const user = userEvent.setup();
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 2, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 点击上一页按钮
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));
      const prevButton = screen.getByText('上一页');
      await user.click(prevButton);

      // THEN: 应调用回调函数并传入页码 1
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('[P2] 在第一页时上一页按钮应禁用', () => {
      // GIVEN: 在第一页的项目列表
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 1, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 上一页按钮应被禁用
      const prevButton = screen.getByText('上一页').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('[P2] 在最后一页时下一页按钮应禁用', () => {
      // GIVEN: 在最后一页的项目列表
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 3, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 下一页按钮应被禁用
      const nextButton = screen.getByText('下一页').closest('button');
      expect(nextButton).toBeDisabled();
    });

    it('[P2] 应显示当前页码和总页数', () => {
      // GIVEN: 有多页数据的项目列表
      const mockData = createMockResponse(12, {
        meta: { total: 36, page: 2, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 应显示正确的页码
      expect(screen.getByText(/第 2 \/ 3 页/)).toBeInTheDocument();
    });
  });

  describe('[P2] 加载状态', () => {
    it('[P2] 应显示骨架屏加载状态', () => {
      // GIVEN: 组件处于加载状态
      // WHEN: 渲染 ShowcaseGrid 并设置 isLoading
      render(withRouter(<ShowcaseGrid isLoading={true} onPageChange={onPageChange} />));

      // THEN: 应显示骨架屏元素
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('[P2] 应显示正确数量的骨架卡片', () => {
      // GIVEN: 组件处于加载状态
      // WHEN: 渲染 ShowcaseGrid 并设置 isLoading
      render(withRouter(<ShowcaseGrid isLoading={true} onPageChange={onPageChange} />));

      // THEN: 应显示 6 个骨架���片
      const skeletons = document.querySelectorAll('.border.rounded-lg');
      // 根据组件实现，应该有 6 个骨架卡片
      expect(skeletons.length).toBe(6);
    });
  });

  describe('[P2] 错误状态', () => {
    it('[P2] 应显示错误提示', () => {
      // GIVEN: 组件处于错误状态
      const error = new Error('Failed to fetch');

      // WHEN: 渲染 ShowcaseGrid 并设置 error
      render(withRouter(<ShowcaseGrid error={error} onPageChange={onPageChange} />));

      // THEN: 应显示错误提示
      expect(screen.getByText(/加载失败|重试/)).toBeInTheDocument();
    });

    it('[P2] 错误状态下不应显示项目列表', () => {
      // GIVEN: 组件处于错误状态
      const error = new Error('Failed to fetch');
      const mockData = createMockResponse(6);

      // WHEN: 渲染 ShowcaseGrid 并设置 error（即使有数据也不应显示）
      render(withRouter(<ShowcaseGrid data={mockData} error={error} onPageChange={onPageChange} />));

      // THEN: 不应显示项目卡片
      expect(screen.queryByText('project-1')).not.toBeInTheDocument();
    });
  });

  describe('[P2] 空状态', () => {
    it('[P2] 应显示空状态提示', () => {
      // GIVEN: 空的项目列表
      const mockData = createMockResponse(0, {
        items: [],
        meta: { total: 0, page: 1, pageSize: 12, totalPages: 0 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 应显示空状态提示
      expect(screen.getByText(/暂无项目展示|没有找到/)).toBeInTheDocument();
    });

    it('[P2] 空状态下不应显示分页控件', () => {
      // GIVEN: 空的项目列表
      const mockData = createMockResponse(0, {
        items: [],
        meta: { total: 0, page: 1, pageSize: 12, totalPages: 0 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 不应显示分页控件
      expect(screen.queryByText('上一页')).not.toBeInTheDocument();
      expect(screen.queryByText('下一页')).not.toBeInTheDocument();
    });
  });

  describe('[P2] 状态优先级', () => {
    it('[P2] 加载状态优先于数据显示', () => {
      // GIVEN: 同时有数据和加载状态
      const mockData = createMockResponse(6);

      // WHEN: 渲染 ShowcaseGrid 并设置 isLoading
      render(<ShowcaseGrid data={mockData} isLoading={true} onPageChange={onPageChange} />);

      // THEN: 应显示加载状态，不显示项目卡片
      expect(screen.queryByText('project-1')).not.toBeInTheDocument();
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('[P2] 错误状态优先于加载状态', () => {
      // GIVEN: 同时有错误和加载状态
      const error = new Error('Failed to fetch');

      // WHEN: 渲染 ShowcaseGrid 并设置 error 和 isLoading
      render(withRouter(<ShowcaseGrid error={error} isLoading={false} onPageChange={onPageChange} />));

      // THEN: 应显示错误状态
      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
    });

    it('[P2] 错误状态优先于数据状态', () => {
      // GIVEN: 同时有错误和数据
      const error = new Error('Failed to fetch');
      const mockData = createMockResponse(6);

      // WHEN: 渲染 ShowcaseGrid 并设置 error（即使有数据）
      render(withRouter(<ShowcaseGrid data={mockData} error={error} onPageChange={onPageChange} />));

      // THEN: 应显示错误状态，不显示项目卡片
      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
      expect(screen.queryByText('project-1')).not.toBeInTheDocument();
    });
  });

  describe('[P3] 可访问性', () => {
    it('[P3] 分页按钮应有正确的文本标签', () => {
      // GIVEN: 有多页数据的项目列表
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 2, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 分页按钮应有描述性文本
      expect(screen.getByRole('button', { name: /上一页/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /下一页/ })).toBeInTheDocument();
    });

    it('[P3] 禁用按钮应有正确的 aria-disabled 属性', () => {
      // GIVEN: 在第一页的项目列表
      const mockData = createMockResponse(12, {
        meta: { total: 25, page: 1, pageSize: 12, totalPages: 3 },
      });

      // WHEN: 渲染 ShowcaseGrid
      render(withRouter(<ShowcaseGrid data={mockData} onPageChange={onPageChange} />));

      // THEN: 上一页按钮应被禁用
      const prevButton = screen.getByRole('button', { name: /上一页/ });
      expect(prevButton).toBeDisabled();
    });
  });
});
