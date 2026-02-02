/**
 * Product Category Service
 * Mahsulot turlari bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface ProductCategory {
  id: number;
  name: string;
  sorting: number | null;
  is_delete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface ProductCategoryListResponse {
  pagination: PaginationMeta;
  results: ProductCategory[];
  filters: unknown;
}

export interface ProductCategoryQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  ordering?: string;
  is_delete?: boolean;
}

export const productCategoryService = {
  // Get all categories
  getCategories: async (params?: ProductCategoryQueryParams) => {
    return api.get<ProductCategoryListResponse>(API_ENDPOINTS.productCategories.list, {
      params,
    });
  },

  // Get category by ID
  getCategoryById: async (id: string) => {
    return api.get<ProductCategory>(API_ENDPOINTS.productCategories.byId(id));
  },

  // Create category
  createCategory: async (data: Partial<ProductCategory>) => {
    return api.post<ProductCategory>(API_ENDPOINTS.productCategories.create, data);
  },

  // Update category
  updateCategory: async (id: number, data: Partial<ProductCategory>) => {
    return api.patch<ProductCategory>(API_ENDPOINTS.productCategories.update(id.toString()), data);
  },

  // Delete category
  deleteCategory: async (id: number) => {
    return api.delete(API_ENDPOINTS.productCategories.delete(id.toString()));
  },
};
