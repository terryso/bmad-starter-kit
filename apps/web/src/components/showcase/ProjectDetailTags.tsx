import { Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProjectDetail } from '@bmad-starter-kit/shared';

interface ProjectDetailTagsProps {
  project: ProjectDetail;
}

export function ProjectDetailTags({ project }: ProjectDetailTagsProps) {
  const allTags = [...project.topics, ...project.suggestedTags];
  const uniqueTags = Array.from(new Set(allTags));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="w-5 h-5" />
          标签
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uniqueTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {uniqueTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无标签</p>
        )}
      </CardContent>
    </Card>
  );
}
