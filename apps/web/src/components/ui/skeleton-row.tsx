export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <div className="skeleton-shimmer w-20 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer h-4 w-48" />
        <div className="skeleton-shimmer h-3 w-24" />
      </div>
      <div className="skeleton-shimmer h-6 w-16 rounded-full" />
      <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-elevated p-4 space-y-4">
      <div className="skeleton-shimmer w-full aspect-video rounded-lg" />
      <div className="space-y-2">
        <div className="skeleton-shimmer h-4 w-3/4" />
        <div className="skeleton-shimmer h-3 w-1/2" />
      </div>
    </div>
  );
}
