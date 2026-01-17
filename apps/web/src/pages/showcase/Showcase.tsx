import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import type { ProjectCategory } from '@bmad-starter-kit/shared';
import { Package, Search } from 'lucide-react';
import { ShowcaseGrid } from '@/components/showcase/ShowcaseGrid';
import { ShowcaseFilters } from '@/components/showcase/ShowcaseFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 从 URL 获取查询参数
  const page = Number(searchParams.get('page')) || 1;
  const category = (searchParams.get('category') as ProjectCategory) || undefined;
  const language = searchParams.get('language') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') as 'latest' | 'stars' | 'recentlyAdded') || 'recentlyAdded';

  // 搜索输入状态 - 与 URL 同步
  const [searchInput, setSearchInput] = useState(search || '');

  // 当 URL search 参数变化时，同步更新搜索框
  useEffect(() => {
    setSearchInput(search || '');
  }, [search]);

  // 获取项目列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['showcase-projects', { page, category, language, search, sort }],
    queryFn: () =>
      showcaseApi.getProjects({
        page,
        pageSize: 12,
        category,
        language,
        search,
        sort,
      }),
  });

  // 更新 URL 查询参数
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  // 搜索处理
  const handleSearch = () => {
    updateParams({
      page: '1',
      category,
      language,
      search: searchInput || null,
      sort,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">项目展示</h1>
              <p className="text-muted-foreground mt-1">
                探索用 BMAD 构建的精彩项目
              </p>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mt-6 flex gap-2 max-w-md">
            <Input
              placeholder="搜索项目名称或描述..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="container mx-auto px-4 py-6">
        {/* 筛选栏 */}
        <ShowcaseFilters
          category={category}
          language={language}
          sort={sort}
          onCategoryChange={(value) =>
            updateParams({ page: '1', category: value, language, search, sort })
          }
          onLanguageChange={(value) =>
            updateParams({ page: '1', category, language: value, search, sort })
          }
          onSortChange={(value) =>
            updateParams({ page: '1', category, language, search, sort: value })
          }
        />

        {/* 项目网格 */}
        <ShowcaseGrid
          data={data}
          isLoading={isLoading}
          error={error}
          onPageChange={(newPage) =>
            updateParams({ page: String(newPage), category, language, search, sort })
          }
        />
      </div>
    </div>
  );
}
