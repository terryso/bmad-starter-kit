import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { SystemStats } from '@cuplayer/shared';

/**
 * React Query hook for fetching system statistics
 * Requires admin role - API will return 403 for non-admin users
 *
 * ## Features
 * - Auto-refetches every 30 seconds to keep stats current
 * - Shows loading state while fetching
 * - Error state for permission issues or network errors
 *
 * @returns Query result with stats data
 */
export function useAdminStats() {
  return useQuery<{ data: SystemStats; statusCode: number; message: string }>({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    // Stats should refresh periodically to show current data
    refetchInterval: 30000, // 30 seconds
    // Don't refetch on window focus since we have interval
    refetchOnWindowFocus: false,
  });
}
