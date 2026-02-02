/**
 * Customer Service
 * Customer bilan bog'liq barcha API chaqiruvlari
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: number;
  totalSpent: string;
  status: 'active' | 'inactive' | 'vip';
  joinDate: string;
  avatar?: string;
}

export interface CustomerListResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface CustomerQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  status?: 'active' | 'inactive' | 'vip';
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

// Customer Service
export const customerService = {
  /**
   * Get all customers
   */
  getAll: async (params?: CustomerQueryParams): Promise<CustomerListResponse> => {
    return api.get<CustomerListResponse>(API_ENDPOINTS.customers.list, {
      params,
    });
  },

  /**
   * Get customer by ID
   */
  getById: async (id: string): Promise<Customer> => {
    return api.get<Customer>(API_ENDPOINTS.customers.byId(id));
  },

  /**
   * Create new customer
   */
  create: async (data: CreateCustomerData): Promise<Customer> => {
    return api.post<Customer>(API_ENDPOINTS.customers.create, data);
  },

  /**
   * Update customer
   */
  update: async (id: string, data: UpdateCustomerData): Promise<Customer> => {
    return api.put<Customer>(API_ENDPOINTS.customers.update(id), data);
  },

  /**
   * Delete customer
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(API_ENDPOINTS.customers.delete(id));
  },

  /**
   * Search customers
   */
  search: async (query: string): Promise<Customer[]> => {
    return api.get<Customer[]>(API_ENDPOINTS.customers.search, {
      params: { q: query },
    });
  },
};
