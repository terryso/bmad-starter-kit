import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UsersTable } from '@/components/admin/UsersTable';
import { useAuthStore } from '@/stores/auth.store';
import { Users } from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">用户管理</h1>
            <p className="text-sm text-muted-foreground">
              查看和管理平台所有注册用户
            </p>
          </div>
        </div>

        {/* 用户表格 */}
        <UsersTable currentUserRole={user?.role || null} />
      </div>
    </DashboardLayout>
  );
}
