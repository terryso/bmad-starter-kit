import { Link } from 'react-router-dom';
import { Star, GitFork, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Project, RelatedProject } from '@bmad-starter-kit/shared';

interface ProjectCardProps {
  project: Project | RelatedProject;
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web 应用',
  CLI: '命令行工具',
  LIBRARY: '库/框架',
  API: 'API 服务',
  MOBILE: '移动应用',
  OTHER: '其他',
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/showcase/${project.id}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
        <CardContent className="pt-4">
          {/* 仓库名称 */}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {project.repositoryName}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {project.description || '暂无描述'}
          </p>

          {/* 语言和分类标签 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {project.language && (
              <Badge variant="secondary" className="text-xs">
                {project.language}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[project.category] || project.category}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* 星标数 */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{project.stars.toLocaleString()}</span>
            </div>

            {/* Fork 数 */}
            <div className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              <span>{project.forks?.toLocaleString() ?? '0'}</span>
            </div>

            {/* Issues 数 */}
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>{project.openIssues?.toLocaleString() ?? '0'}</span>
            </div>
          </div>

          {/* 所有者 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{project.owner}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
