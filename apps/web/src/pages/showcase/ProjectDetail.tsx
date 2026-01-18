import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectDetailHeader } from '@/components/showcase/ProjectDetailHeader';
import { ProjectDetailStats } from '@/components/showcase/ProjectDetailStats';
import { ProjectDetailMeta } from '@/components/showcase/ProjectDetailMeta';
import { ProjectDetailTags } from '@/components/showcase/ProjectDetailTags';
import { RelatedProjects } from '@/components/showcase/RelatedProjects';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 获取项目详情
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () => (id ? showcaseApi.getProjectById(id) : Promise.reject('No ID')),
    enabled: !!id,
    retry: false,
  });

  // 错误处理
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">404</div>
            <h2 className="text-xl font-semibold mb-2">项目不存在</h2>
            <p className="text-muted-foreground mb-4">
              您访问的项目可能已被删除或未通过审核。
            </p>
            <Button asChild variant="default">
              <Link to="/showcase">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回项目展示
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" className="mb-6" disabled>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/showcase">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回项目展示
          </Link>
        </Button>

        {/* 项目头部 */}
        <ProjectDetailHeader project={project} />

        {/* 统计数据 */}
        <div className="mt-6">
          <ProjectDetailStats project={project} />
        </div>

        {/* 元数据信息 */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <ProjectDetailMeta project={project} />
          <ProjectDetailTags project={project} />
        </div>

        {/* 相关项目 */}
        <RelatedProjects projectId={project.id} />
      </div>
    </div>
  );
}
