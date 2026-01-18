import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  FolderOpen,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Metric Card Props
 */
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
}

/**
 * Individual metric card component
 */
function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for stats cards
 */
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Stats Cards Component
 *
 * Displays BMAD showcase system statistics in a grid of metric cards.
 * Fetches real-time data from the admin stats API.
 *
 * ## Statistics Displayed
 * - Total users, projects, pending projects, total stars
 * - New users and projects today
 * - New users this month
 *
 * ## Auto-Refresh
 * Data automatically refreshes every 30 seconds to stay current.
 */
export function StatsCards() {
  const { data: response, isLoading, error } = useAdminStats();

  if (isLoading) {
    return <StatsCardsSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            加载统计数据失败: {error instanceof Error ? error.message : '未知错误'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = response?.data;

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">暂无统计数据</p>
        </CardContent>
      </Card>
    );
  }

  const metrics: MetricCardProps[] = [
    {
      title: '总用户数',
      value: stats.totalUsers,
      icon: Users,
      description: '注册用户总数',
    },
    {
      title: '总项目数',
      value: stats.totalProjects,
      icon: FolderOpen,
      description: '展示项目总数',
    },
    {
      title: '待审核项目',
      value: stats.pendingProjects,
      icon: Clock,
      description: '等待审核',
    },
    {
      title: '总星标数',
      value: stats.totalStars,
      icon: Star,
      description: '所有项目星标总和',
    },
    {
      title: '今日新用户',
      value: stats.newUsersToday,
      icon: TrendingUp,
      description: '今日注册',
    },
    {
      title: '今日新项目',
      value: stats.newProjectsToday,
      icon: Calendar,
      description: '今日提交',
    },
    {
      title: '本月新用户',
      value: stats.newUsersThisMonth,
      icon: UserCheck,
      description: '本月注册',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          description={metric.description}
        />
      ))}
    </div>
  );
}
