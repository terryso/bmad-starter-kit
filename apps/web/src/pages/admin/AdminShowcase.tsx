import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Shield, CheckCircle, XCircle, Github, ExternalLink, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { APPROVE_DIALOG_TEXT, REJECT_DIALOG_TEXT } from '@/constants/showcase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { PendingProject, PendingProjectsListResponse } from '@bmad-starter-kit/shared';

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export default function AdminShowcasePage() {
  return (
    <DashboardLayout>
      <AdminShowcaseContent />
    </DashboardLayout>
  );
}

function AdminShowcaseContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pageSize = 12;

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; reason: string }>({
    open: false,
    id: '',
    reason: '',
  });

  // 获取待审核项目
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admin-pending-projects', page],
    queryFn: () => adminApi.getPendingProjects({ page, pageSize }),
    placeholderData: keepPreviousData, // 翻页时保持旧数据
    staleTime: 30000, // 30秒内不会重新请求
  });

  // 标记首次加载完成
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);

  // 批准项目
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
      toast.success('项目已批准');
      setApproveDialog({ open: false, id: '' });
    },
    onError: () => {
      toast.error('操作失败，请重试');
    },
  });

  // 拒绝项目
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectProject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
      toast.success('项目已拒绝');
      setRejectDialog({ open: false, id: '', reason: '' });
    },
    onError: () => {
      toast.error('操作失败，请重试');
    },
  });

  const handleApprove = () => {
    approveMutation.mutate(approveDialog.id);
  };

  const handleReject = () => {
    if (rejectDialog.reason.trim().length < 5) {
      toast.error('拒绝原因至少需要 5 个字符');
      return;
    }
    rejectMutation.mutate({
      id: rejectDialog.id,
      reason: rejectDialog.reason,
    });
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

  // 加载状态 - 首次加载或无数据时显示骨架图
  if (isLoading || !data || (isFetching && isInitialLoad)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Skeleton className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <AlertDescription>
          加载失败，请刷新页面重试
        </AlertDescription>
      </Alert>
    );
  }

  // 等待数据加载时返回 null（保持旧数据可见）
  if (!data) {
    return null;
  }

  // 根据数据状态渲染内容
  const renderContent = () => {
    // 无待审核项目
    if (data.items.length === 0 && !isFetching) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">全部处理完成</h2>
          <p className="text-muted-foreground text-center max-w-md">
            暂无待审核项目，所有提交都已处理完毕
          </p>
        </div>
      );
    }

    // 待审核项目列表
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Badge variant="outline">
                  {CATEGORY_LABELS[project.category] || project.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* 项目描述 */}
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {project.description || '暂无描述'}
              </p>

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
                  <User className="w-4 h-4" />
                  <span className="truncate">
                    {project.submittedBy.name || project.submittedBy.email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => setRejectDialog({ open: true, id: project.id, reason: '' })}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  拒绝
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => setApproveDialog({ open: true, id: project.id })}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  批准
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分页 */}
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.meta.total} 个待审核项目
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
              <ChevronRight className="w-4 h-4 ml-1" />
              下一页
            </Button>
          </div>
        </div>
      )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 - 始终显示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">项目审核</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? '加载中...' : `共 ${data.meta.total} 个待审核项目`}
            </p>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {renderContent()}

      {/* 批准确认对话框 */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, id: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批准项目</DialogTitle>
            <DialogDescription>
              {APPROVE_DIALOG_TEXT}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, id: '' })}
              disabled={approveMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? '处理中...' : '确认批准'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝对话框 */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, id: '', reason: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝项目</DialogTitle>
            <DialogDescription>
              {REJECT_DIALOG_TEXT}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                拒绝原因 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="请说明拒绝原因（至少 5 个字符）"
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                rows={4}
                disabled={rejectMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                此原因将显示给项目提交者
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, id: '', reason: '' })}
              disabled={rejectMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
