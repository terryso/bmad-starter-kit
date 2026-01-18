import { useEffect, useState, useCallback } from 'react';
import type { UserListItem, PaginationMeta } from '@bmad-starter-kit/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface UsersTableProps {
  currentUserRole: 'USER' | 'ADMIN' | null;
}

export function UsersTable({ currentUserRole }: UsersTableProps) {
  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id;

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const pageSize = 10;

  // 选中状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string; userName?: string }>({
    open: false,
  });
  const [batchDeleteDialog, setBatchDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async (currentPage: number) => {
    try {
      // Only show loading skeleton on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      const response = await adminApi.getUsers({ page: currentPage, pageSize });
      setUsers(response.users);
      setPagination(response.pagination);
      // 清理已删除的用户ID
      setSelectedIds(prev => {
        const validIds = new Set(response.users.map(u => u.id));
        const filtered = new Set<string>();
        prev.forEach(id => {
          if (validIds.has(id)) filtered.add(id);
        });
        return filtered;
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  // 全选/取消全选
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(users.map(u => u.id));
      // 排除当前用户
      if (currentUserId) {
        allIds.delete(currentUserId);
      }
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  }, [users, currentUserId]);

  // 单选
  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  // 检查是否全选
  const isAllSelected = users.length > 0 && users.every(u => u.id === currentUserId || selectedIds.has(u.id));
  // 检查是否部分选中
  const isSomeSelected = selectedIds.size > 0;
  // 可选中的用户数量（排除当前用户）
  const selectableCount = currentUserId ? users.filter(u => u.id !== currentUserId).length : users.length;

  // 删除单个用户
  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    setIsDeleting(true);
    try {
      await adminApi.deleteUser(deleteDialog.userId, currentUserId);
      toast.success('用户已删除');
      setDeleteDialog({ open: false });
      // 刷新列表
      await fetchUsers(page);
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await adminApi.batchDeleteUsers(Array.from(selectedIds), currentUserId);

      if (result.failed === 0) {
        toast.success(`成功删除 ${result.success} 个用户`);
      } else {
        toast.success(`成功删除 ${result.success} 个用户，${result.failed} 个失败`);
      }

      setBatchDeleteDialog(false);
      setSelectedIds(new Set());
      // 刷新列表
      await fetchUsers(page);
    } catch (error: any) {
      toast.error(error.message || '批量删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 批量操作工具栏 */}
      {isSomeSelected && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm text-muted-foreground">
            已选择 <span className="font-medium text-foreground">{selectedIds.size}</span> 个用户
          </span>
          <AlertDialog open={batchDeleteDialog} onOpenChange={setBatchDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-1" />
                批量删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除选中的 <span className="font-medium">{selectedIds.size}</span> 个用户吗？
                  此操作不可撤销，这些用户的所有数据将被永久删除。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked === true)}
                      disabled={user.id === currentUserId}
                      aria-label={`选择 ${user.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role === 'ADMIN' ? '管理员' : '用户'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                  <TableCell className="text-right">
                    {user.id === currentUserId ? (
                      <span className="text-sm text-muted-foreground">当前用户</span>
                    ) : (
                      <AlertDialog
                        open={deleteDialog.open && deleteDialog.userId === user.id}
                        onOpenChange={(open) => setDeleteDialog({ open, userId: user.id, userName: user.name })}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除用户 <span className="font-medium">{deleteDialog.userName}</span> 吗？
                              <br />
                              此操作不可撤销，该用户的所有数据将被永久删除。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteUser}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? '删除中...' : '确认删除'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控件 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {pagination.total} 个用户
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
