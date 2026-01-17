import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, FolderOpen, Star, TrendingUp, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Metric Card Props
 */
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  href?: string;
}

/**
 * Individual metric card component
 */
function MetricCard({ title, value, icon: Icon, description, href }: MetricCardProps) {
  const cardContent = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Card className="group cursor-pointer hover:border-primary/50 transition-colors">
        <Link to={href} className="block">
          {cardContent}
        </Link>
      </Card>
    );
  }

  return <Card>{cardContent}</Card>;
}

/**
 * Dashboard Stats Component
 */
function DashboardStats() {
  const { data: showcaseData, isLoading: showcaseLoading } = useQuery({
    queryKey: ['showcase-stats'],
    queryFn: () => showcaseApi.getProjects({ page: 1, pageSize: 1 }),
  });

  const totalProjects = showcaseData?.meta?.total || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {showcaseLoading ? (
        <>
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </>
      ) : (
        <>
          <MetricCard
            title="项目展示"
            value={totalProjects}
            icon={FolderOpen}
            description="公开展示项目"
            href="/showcase"
          />
          <MetricCard
            title="最近更新"
            value="7天"
            icon={TrendingUp}
            description="本周活跃"
            href="/showcase?sort=latest"
          />
          <MetricCard
            title="热门项目"
            value="Top 10"
            icon={Star}
            description="按星标排序"
            href="/showcase?sort=stars"
          />
          <Card className="flex items-center justify-center">
            <CardContent className="pt-6">
              <Link to="/showcase">
                <Button variant="outline" className="w-full">
                  查看全部项目
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * Regular User Dashboard / Welcome Page
 *
 * Shown to non-admin users after login
 */
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 欢迎头部 */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            欢迎回来！
          </h1>
          <p className="text-muted-foreground mt-1">
            探索平台功能和精彩项目
          </p>
        </div>

        {/* 统计卡片 */}
        <DashboardStats />

        {/* 快速入口 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="group cursor-pointer hover:border-primary/50 transition-colors">
            <Link to="/showcase" className="block">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>项目展示</CardTitle>
                  <FolderOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  探索社区成员用 BMAD 构建的精彩项目，获取灵感和学习资源。
                </p>
                <div className="flex gap-2 mt-4">
                  <Badge variant="secondary">Web 应用</Badge>
                  <Badge variant="secondary">API 服务</Badge>
                  <Badge variant="secondary">库/框架</Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>个人中心</CardTitle>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                管理您的个人资料和账户设置。
              </p>
              <div className="mt-4">
                <Link to="/profile">
                  <Button variant="outline" size="sm">
                    前往个人中心
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
