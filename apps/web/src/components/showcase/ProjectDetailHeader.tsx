import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProjectDetail } from '@bmad-starter-kit/shared';

interface ProjectDetailHeaderProps {
  project: ProjectDetail;
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  return (
    <div className="space-y-4">
      {/* 标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.repositoryName}
            </h1>
            <Badge variant="outline">
              {CATEGORY_LABELS[project.category] || project.category}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            由 <span className="font-medium">{project.owner}</span> 开发
          </p>
        </div>

        {/* GitHub 按钮 */}
        <Button asChild variant="default" size="lg">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            <Github className="w-5 h-5" />
            查看 GitHub
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      {/* 项目描述 */}
      <p className="text-lg text-muted-foreground leading-relaxed">
        {project.description || '暂无描述'}
      </p>

      {/* 官网链接（如果有） */}
      {project.homepageUrl && (
        <div>
          <Button asChild variant="link" className="p-0 h-auto">
            <a
              href={project.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              访问项目官网
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
