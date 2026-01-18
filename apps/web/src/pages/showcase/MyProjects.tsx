import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import type { ProjectStatus } from '@bmad-starter-kit/shared';
import { FolderOpen, Trash2, ExternalLink, Github, ChevronLeft, ChevronRight, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubmitProjectDialog } from '@/components/showcase/SubmitProjectDialog';
import type { MyProject } from '@bmad-starter-kit/shared';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已批准',
  REJECTED: '已拒绝',
};

const STATUS_VARIANTS: Record<ProjectStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'default',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
};

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export default function MyProjectsPage() {
  return (
    <DashboardLayout>
      <MyProjectsContent />
    </DashboardLayout>
  );
}

function MyProjectsContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>(undefined);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pageSize = 10;
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: MyProject | null }>({
    open: false,
    project: null,
  });

  // 获取我的项目
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['my-projects', page, statusFilter],
    queryFn: () =>
      showcaseApi.getMyProjects({
        page,
        pageSize,
        status: statusFilter,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  // 标记首次加载完成
  if (isInitialLoad && !isLoading) {
    setIsInitialLoad(false);
  }

  // 删除项目
  const deleteMutation = useMutation({
    mutationFn: (id: string) => showcaseApi.deleteMyProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      toast.success('项目已删除');
      setDeleteDialog({ open: false, project: null });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error).message || '删除失败，请重试';
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (deleteDialog.project) {
      deleteMutation.mutate(deleteDialog.project.id);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 加载状态 - 只在首次加载且无数据时显示骨架图
  if (isInitialLoad && isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 错误状态 - 只在无数据时显示错误页面
  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          加载失败，请刷新页面重试
        </AlertDescription>
      </Alert>
    );
  }

  // 无项目 - 只在非首次加载且有数据时显示
  if (!isInitialLoad && data && data.items.length === 0 && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">暂无项目</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {statusFilter
            ? '当前筛选条件下没有项目'
            : '您还没有提交任何项目，去展示页面提交您的第一个项目吧'}
        </p>
      </div>
    );
  }

  // 等待数据加载时返回 null（保持旧数据可见）
  if (!data) {
    return null;
  }

  // 根据当前状态筛选获取可用的状态选项
  const hasPending = data.items.some((p) => p.status === 'PENDING');
  const hasApproved = data.items.some((p) => p.status === 'APPROVED');
  const hasRejected = data.items.some((p) => p.status === 'REJECTED');

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">我的项目</h1>
            <p className="text-sm text-muted-foreground">
              共 {data.meta.total} 个项目
            </p>
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 提交项目按钮 */}
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

          {/* 状态筛选 */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(undefined);
                setPage(1);
              }}
            >
              全部
            </Button>
            <Button
              variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('PENDING');
                setPage(1);
              }}
              disabled={!hasPending && statusFilter !== 'PENDING'}
            >
              待审核
            </Button>
            <Button
              variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('APPROVED');
                setPage(1);
              }}
              disabled={!hasApproved && statusFilter !== 'APPROVED'}
            >
              已批准
            </Button>
            <Button
              variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('REJECTED');
                setPage(1);
              }}
              disabled={!hasRejected && statusFilter !== 'REJECTED'}
            >
              已拒绝
            </Button>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.items.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate" title={project.repositoryName}>
                    {project.repositoryName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {project.owner}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[project.status]}>
                  {STATUS_LABELS[project.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* 项目描述 */}
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {project.description || '暂无描述'}
              </p>

              {/* 拒绝原因 */}
              {project.status === 'REJECTED' && project.rejectionReason && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {project.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}

              {/* 项目信息 */}
              <div className="space-y-2 text-sm">
                {project.language && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">语言:</span>
                    <Badge variant="secondary" className="font-normal">
                      {project.language}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>提交时间:</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                {project.reviewedAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>审核时间:</span>
                    <span>{formatDate(project.reviewedAt)}</span>
                  </div>
                )}
              </div>

              {/* 标签 */}
              {project.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.topics.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {project.topics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.topics.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1"
                  >
                    <Github className="w-4 h-4" />
                    查看
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                {project.status !== 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => setDeleteDialog({ open: true, project })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分页 */}
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.meta.total} 个项目
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {page} / {data.meta.totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.meta.totalPages}
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, project: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除项目 <strong>{deleteDialog.project?.repositoryName}</strong> 吗？
              <br />
              <br />
              此操作无法撤销。已批准的项目不能删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
