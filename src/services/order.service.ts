/**
 * Order Service
 * Buyurtma bilan bog'liq barcha API chaqiruvlari
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface OrderQueryParams {
  page?: number;
  perPage?: number;
  status?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderData {
  customerId: string;
  productId: string;
  quantity: number;
  amount: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

export type UpdateOrderData = Partial<CreateOrderData>;

// Order Service
export const orderService = {
  /**
   * Get all orders
   */
  getAll: async (params?: OrderQueryParams): Promise<OrderListResponse> => {
    return api.get<OrderListResponse>(API_ENDPOINTS.orders.list, {
      params,
    });
  },

  /**
   * Get recent orders
   */
  getRecent: async (limit = 5): Promise<Order[]> => {
    return api.get<Order[]>(API_ENDPOINTS.orders.recent, {
      params: { limit },
    });
  },

  /**
   * Get order by ID
   */
  getById: async (id: string): Promise<Order> => {
    return api.get<Order>(API_ENDPOINTS.orders.byId(id));
  },

  /**
   * Create new order
   */
  create: async (data: CreateOrderData): Promise<Order> => {
    return api.post<Order>(API_ENDPOINTS.orders.create, data);
  },

  /**
   * Update order
   */
  update: async (id: string, data: UpdateOrderData): Promise<Order> => {
    return api.put<Order>(API_ENDPOINTS.orders.update(id), data);
  },

  /**
   * Delete order
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(API_ENDPOINTS.orders.delete(id));
  },
};
