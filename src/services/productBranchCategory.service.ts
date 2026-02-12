/**
 * Product Branch Category Service
 * Mahsulot turlari kategoriyasi (product-branch-category) bilan ishlash
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

export interface ProductBranchCategory {
  id: number;
  product_branch: number;
  name: string;
  sorting: number | null;
  is_delete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductBranchCategoryListResponse {
  pagination: PaginationMeta;
  results: ProductBranchCategory[];
  filters: unknown;
}

export interface ProductBranchCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  ordering?: string;
  is_delete?: boolean;
  product_branch?: number;
}

export interface SuggestedSortingResponse {
  suggested_sorting: number;
  message: string;
}

export const productBranchCategoryService = {
  getCategories: async (params?: ProductBranchCategoryQueryParams) => {
    return api.get<ProductBranchCategoryListResponse>(API_ENDPOINTS.productBranchCategories.list, {
      params,
    });
  },

  getCategoryById: async (id: string) => {
    return api.get<ProductBranchCategory>(API_ENDPOINTS.productBranchCategories.byId(id));
  },

  createCategory: async (data: Partial<ProductBranchCategory>) => {
    return api.post<ProductBranchCategory>(API_ENDPOINTS.productBranchCategories.create, data);
  },

  updateCategory: async (id: number, data: Partial<ProductBranchCategory>) => {
    return api.patch<ProductBranchCategory>(
      API_ENDPOINTS.productBranchCategories.update(id.toString()),
      data
    );
  },

  deleteCategory: async (id: number) => {
    return api.delete(API_ENDPOINTS.productBranchCategories.delete(id.toString()));
  },

  // Get suggested sorting for a product branch
  getSuggestedSorting: async (productBranchId: number) => {
    return api.get<SuggestedSortingResponse>(
      API_ENDPOINTS.productBranchCategories.suggestedSorting(productBranchId.toString())
    );
  },
};
