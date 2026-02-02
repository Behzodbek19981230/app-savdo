/**
 * Analytics Hooks
 * React Query hooks for analytics
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services';

// Query keys
export const ANALYTICS_KEYS = {
  all: ['analytics'] as const,
  dashboardStats: ['analytics', 'dashboard'] as const,
  revenue: (params?: any) => ['analytics', 'revenue', params] as const,
  sales: (params?: any) => ['analytics', 'sales', params] as const,
};

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.dashboardStats,
    queryFn: () => analyticsService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get revenue data
 */
export function useRevenueData(params?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.revenue(params),
    queryFn: () => analyticsService.getRevenueData(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get sales data
 */
export function useSalesData(params?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.sales(params),
    queryFn: () => analyticsService.getSalesData(params),
    staleTime: 5 * 60 * 1000,
  });
}
