import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import type { ProjectCategory } from '@bmad-starter-kit/shared';
import { Search, Plus, User } from 'lucide-react';
import { ShowcaseGrid } from '@/components/showcase/ShowcaseGrid';
import { ShowcaseFilters } from '@/components/showcase/ShowcaseFilters';
import { SubmitProjectDialog } from '@/components/showcase/SubmitProjectDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

export default function ShowcasePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

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

  // 处理提交项目按钮点击
  const handleSubmitProjectClick = () => {
    if (isAuthenticated) {
      setSubmitDialogOpen(true);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 简洁的顶部导航栏 */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">BMAD 项目展示</span>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/showcase/my-projects')}>
                    我的项目
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    {user?.name || '个人中心'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    登录
                  </Button>
                  <Button onClick={() => navigate('/register')}>
                    注册
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 页面头部 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">项目展示</h1>
              <p className="text-sm text-muted-foreground mt-1">
                探索用 BMAD 构建的精彩项目
              </p>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2">
              {/* 提交项目按钮 - 所有用户可见，登录后可提交 */}
              {isAuthenticated ? (
                <SubmitProjectDialog
                  open={submitDialogOpen}
                  onOpenChange={setSubmitDialogOpen}
                  trigger={
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      提交项目
                    </Button>
                  }
                />
              ) : (
                <Button onClick={handleSubmitProjectClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  提交项目
                </Button>
              )}

              {/* 搜索框 */}
              <div className="flex gap-2">
                <Input
                  placeholder="搜索项目..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-48 sm:w-64"
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

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
      </main>
    </div>
  );
}
