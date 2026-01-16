import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BarChart3 } from 'lucide-react';

/**
 * Regular User Dashboard / Welcome Page
 *
 * Shown to non-admin users after login
 */
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            欢迎回来！
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            您已成功登录系统。管理员功能请在侧边栏查看。
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
