import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCards } from '@/components/admin/stats-cards';
import { BarChart3 } from 'lucide-react';

/**
 * Admin System Stats Page
 *
 * Shows platform statistics and metrics for administrators
 */
export default function SystemStatsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">系统统计</h1>
            <p className="text-sm text-muted-foreground">
              查看平台运行状态和关键指标
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />
      </div>
    </DashboardLayout>
  );
}
