import { Calendar, User, CheckCircle, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProjectDetail } from '@bmad-starter-kit/shared';

interface ProjectDetailMetaProps {
  project: ProjectDetail;
}

export function ProjectDetailMeta({ project }: ProjectDetailMetaProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '未知';
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">项目信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 编程语言 */}
        {project.language && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Code className="w-4 h-4" />
              <span className="text-sm">主要语言</span>
            </div>
            <Badge variant="secondary">{project.language}</Badge>
          </div>
        )}

        {/* 开源协议 */}
        {project.license && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">开源协议</span>
            </div>
            <span className="text-sm font-medium">{project.license}</span>
          </div>
        )}

        {/* 最后更新 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">最后更新</span>
          </div>
          <span className="text-sm">{formatDate(project.githubUpdatedAt)}</span>
        </div>

        {/* 提交时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">提交时间</span>
          </div>
          <span className="text-sm">{formatDate(project.createdAt)}</span>
        </div>

        {/* 提交者 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="text-sm">提交者</span>
          </div>
          <span className="text-sm">{project.submittedBy.name || project.submittedBy.email}</span>
        </div>

        {/* 审核状态 */}
        {project.reviewedBy && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">审核通过</span>
            </div>
            <span className="text-sm">
              由 {project.reviewedBy.name || project.reviewedBy.email} 审核
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
