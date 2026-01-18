import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

/**
 * Hook for fetching pending projects count
 * Used for displaying badge in admin navigation
 *
 * On error, returns 0 to prevent UI disruption
 */
export function usePendingCount() {
  return useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: async () => {
      try {
        return await adminApi.getPendingProjectsCount();
      } catch (error) {
        console.error('Failed to fetch pending projects count:', error);
        return 0; // Return 0 on error to prevent UI disruption
      }
    },
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
    // Don't retry on failure to avoid excessive error logging
    retry: false,
  });
}
