/**
 * Analytics Service
 * Statistika va analytics bilan bog'liq barcha API chaqiruvlari
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface DashboardStats {
  totalRevenue: {
    value: string;
    change: number;
  };
  totalCustomers: {
    value: string;
    change: number;
  };
  totalOrders: {
    value: string;
    change: number;
  };
  growthRate: {
    value: string;
    change: number;
  };
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  percentage: number;
  revenue: string;
}

// Analytics Service
export const analyticsService = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    return api.get<DashboardStats>(API_ENDPOINTS.analytics.dashboard);
  },

  /**
   * Get revenue data
   */
  getRevenueData: async (params?: {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month' | 'year';
  }): Promise<RevenueData[]> => {
    return api.get<RevenueData[]>(API_ENDPOINTS.analytics.revenue, {
      params,
    });
  },

  /**
   * Get sales data
   */
  getSalesData: async (params?: {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month' | 'year';
  }): Promise<SalesData[]> => {
    return api.get<SalesData[]>(API_ENDPOINTS.analytics.sales, {
      params,
    });
  },
};
