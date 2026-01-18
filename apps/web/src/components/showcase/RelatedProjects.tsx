import { useQuery } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectCard } from './ProjectCard';

interface RelatedProjectsProps {
  projectId: string;
}

export function RelatedProjects({ projectId }: RelatedProjectsProps) {
  const {
    data: relatedData,
    isLoading,
  } = useQuery({
    queryKey: ['related-projects', projectId],
    queryFn: () => showcaseApi.getRelatedProjects(projectId),
    enabled: !!projectId,
  });

  const hasRelated = relatedData?.items && relatedData.items.length > 0;

  if (!isLoading && !hasRelated) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">相关项目</h2>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">暂无相关项目</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">相关项目</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatedData?.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
