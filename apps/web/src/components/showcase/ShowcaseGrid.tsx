import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import type { ProjectsListResponse } from '@bmad-starter-kit/shared';

interface ShowcaseGridProps {
  data?: ProjectsListResponse;
  isLoading?: boolean;
  error?: unknown;
  onPageChange: (page: number) => void;
}

export function ShowcaseGrid({ data, isLoading, error, onPageChange }: ShowcaseGridProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">加载失败，请稍后重试</p>
      </div>
    );
  }

  // 空状态
  if (!data?.items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无项目展示</p>
      </div>
    );
  }

  const { items, meta } = data;

  return (
    <div className="space-y-6">
      {/* 项目网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* 分页 */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={meta.page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {meta.page} / {meta.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={meta.page === meta.totalPages}
          >
            下一页
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* 结果统计 */}
      <p className="text-center text-sm text-muted-foreground">
        共 {meta.total} 个项目
      </p>
    </div>
  );
}
