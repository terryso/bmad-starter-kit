import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showcaseApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SyncProjectButtonProps {
  projectId: string;
  onSyncSuccess?: () => void;
}

/**
 * 项目同步按钮组件
 * 只有登录用户才能看到和使用
 * 同步成功后触发 onSyncSuccess 回调
 */
export function SyncProjectButton({ projectId, onSyncSuccess }: SyncProjectButtonProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      await showcaseApi.syncProject(projectId);
      toast.success('项目信息同步成功');

      // 触发成功回调，让父组件刷新数据
      onSyncSuccess?.();
    } catch (err) {
      // 处理 429 错误（速率限制）
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error.response?.status === 429) {
        const message = error.response.data?.message || '距离上次同步不到 5 分钟，请稍后再试';
        toast.error(message);
      } else {
        toast.error(error.response?.data?.message || '同步失败，请稍后重试');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 未登录用户不显示按钮
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
      data-testid="sync-project-button"
    >
      <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
      {isSyncing ? '同步中...' : '同步信息'}
    </Button>
  );
}
