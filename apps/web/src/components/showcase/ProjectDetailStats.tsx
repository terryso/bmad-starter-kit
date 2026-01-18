import { Star, GitFork, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProjectDetail } from '@bmad-starter-kit/shared';

interface ProjectDetailStatsProps {
  project: ProjectDetail;
}

export function ProjectDetailStats({ project }: ProjectDetailStatsProps) {
  const stats = [
    {
      icon: Star,
      label: 'Stars',
      value: project.stars.toLocaleString(),
      className: 'text-yellow-500',
    },
    {
      icon: GitFork,
      label: 'Forks',
      value: project.forks?.toLocaleString() || 'N/A',
      className: 'text-blue-500',
    },
    {
      icon: AlertCircle,
      label: 'Issues',
      value: project.issues?.toLocaleString() || 'N/A',
      className: 'text-purple-500',
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.className}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
