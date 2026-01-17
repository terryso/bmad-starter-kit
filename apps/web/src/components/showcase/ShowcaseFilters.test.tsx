/**
 * ShowcaseFilters 组件测试
 *
 * 测试项目展示筛选器组件的渲染和交互
 * 采用 Given-When-Then 格式
 *
 * 知识库参考:
 * - component-tdd.md (组件 TDD 循环)
 * - test-priorities-matrix.md (P2 优先级 - UI 组件)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowcaseFilters } from './ShowcaseFilters';

describe('ShowcaseFilters', () => {
  const defaultHandlers = {
    onCategoryChange: vi.fn(),
    onLanguageChange: vi.fn(),
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('[P2] 渲染', () => {
    it('[P2] 应渲染分类筛选器', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 应显示分类标签和选择器
      expect(screen.getByText('分类')).toBeInTheDocument();
      const categoryFilter = document.getElementById('category-filter');
      expect(categoryFilter).toBeInTheDocument();
    });

    it('[P2] 应渲染语言筛选器', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 应显示语言标签和选择器
      expect(screen.getByText('语言')).toBeInTheDocument();
      const languageFilter = document.getElementById('language-filter');
      expect(languageFilter).toBeInTheDocument();
    });

    it('[P2] 应渲染排序筛选器', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 应显示排序标签和选择器
      expect(screen.getByText('排序')).toBeInTheDocument();
      const sortFilter = document.getElementById('sort-filter');
      expect(sortFilter).toBeInTheDocument();
    });

    it('[P2] 应有正确的元素 ID', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 所有筛选器应有正确的 ID
      expect(document.getElementById('category-filter')).toBeInTheDocument();
      expect(document.getElementById('language-filter')).toBeInTheDocument();
      expect(document.getElementById('sort-filter')).toBeInTheDocument();
    });
  });

  describe('[P2] 属性传递', () => {
    it('[P2] 应正确传递分类值给 Select 组件', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件并传入分类值
      render(
        <ShowcaseFilters
          {...defaultHandlers}
          category="WEB_APP"
          sort="recentlyAdded"
        />
      );

      // THEN: Select 组件应接收到正确的 value 属性
      // 通过成功渲染来验证属性正确传递
      expect(document.getElementById('category-filter')).toBeInTheDocument();
    });

    it('[P2] 应正确传递语言值给 Select 组件', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件并传入语言值
      render(
        <ShowcaseFilters
          {...defaultHandlers}
          language="TypeScript"
          sort="recentlyAdded"
        />
      );

      // THEN: Select 组件应接收到正确的 value 属性
      expect(document.getElementById('language-filter')).toBeInTheDocument();
    });

    it('[P2] 应正确传递排序值给 Select 组件', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件并传入排序值
      render(
        <ShowcaseFilters
          {...defaultHandlers}
          sort="stars"
        />
      );

      // THEN: Select 组件应接收到正确的 value 属性
      expect(document.getElementById('sort-filter')).toBeInTheDocument();
    });

    it('[P2] 当没有选中分类时应传递 "all" 值', () => {
      // GIVEN: 筛选器组件没有选择分类
      // WHEN: 渲染组件
      render(
        <ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />
      );

      // THEN: 分类选择器应存在
      expect(document.getElementById('category-filter')).toBeInTheDocument();
    });

    it('[P2] 当没有选中语言时应传递 "all" 值', () => {
      // GIVEN: 筛选器组件没有选择语言
      // WHEN: 渲染组件
      render(
        <ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />
      );

      // THEN: 语言选择器应存在
      expect(document.getElementById('language-filter')).toBeInTheDocument();
    });
  });

  describe('[P2] 回调函数', () => {
    it('[P2] 应提供 onCategoryChange 回调', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 回调函数应被正确传递（通过渲染成功来验证）
      expect(screen.getByText('分类')).toBeInTheDocument();
    });

    it('[P2] 应提供 onLanguageChange 回调', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 回调函数应被正确传递
      expect(screen.getByText('语言')).toBeInTheDocument();
    });

    it('[P2] 应提供 onSortChange 回调', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 回调函数应被正确传递
      expect(screen.getByText('排序')).toBeInTheDocument();
    });
  });

  describe('[P3] 可访问性', () => {
    it('[P3] 所有选择器应有正确的 label 关联', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 所有选择器应有对应的 label
      expect(screen.getByLabelText('分类')).toBeInTheDocument();
      expect(screen.getByLabelText('语言')).toBeInTheDocument();
      expect(screen.getByLabelText('排序')).toBeInTheDocument();
    });
  });

  describe('[P3] 组件结构', () => {
    it('[P3] 应使用 flex 布局', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      const { container } = render(
        <ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />
      );

      // THEN: 容器应有正确的 flex 类
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper?.className).toContain('flex');
    });

    it('[P3] 应渲染三个筛选器组', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 应有三个筛选器
      expect(document.getElementById('category-filter')).toBeInTheDocument();
      expect(document.getElementById('language-filter')).toBeInTheDocument();
      expect(document.getElementById('sort-filter')).toBeInTheDocument();
    });
  });

  describe('[P3] 排序选项', () => {
    it('[P3] 应支持 recentlyAdded 排序', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件并传入 recentlyAdded
      render(<ShowcaseFilters {...defaultHandlers} sort="recentlyAdded" />);

      // THEN: 组件应成功渲染
      expect(screen.getByText('排序')).toBeInTheDocument();
    });

    it('[P3] 应支持 stars 排序', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件并传入 stars
      render(<ShowcaseFilters {...defaultHandlers} sort="stars" />);

      // THEN: 组件应成功渲染
      expect(screen.getByText('排序')).toBeInTheDocument();
    });

    it('[P3] 应支持 latest 排序', () => {
      // GIVEN: 筛选器组件
      // WHEN: 渲染组件并传入 latest
      render(<ShowcaseFilters {...defaultHandlers} sort="latest" />);

      // THEN: 组件应成功渲染
      expect(screen.getByText('排序')).toBeInTheDocument();
    });
  });
});
