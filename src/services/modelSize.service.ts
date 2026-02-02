/**
 * Model Size Service
 * Mahsulot model o'lchamlari bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

// Enum for Type
export enum ModelSizeType {
  DONA = '1',
  KAROBKA = '2',
  KOMPLEKT = '3',
  POCHKA = '4',
}

export const ModelSizeTypeLabels: Record<ModelSizeType, string> = {
  [ModelSizeType.DONA]: 'Dona',
  [ModelSizeType.KAROBKA]: 'Karobka',
  [ModelSizeType.KOMPLEKT]: 'Komplekt',
  [ModelSizeType.POCHKA]: 'Pochka',
};

// Types
export interface ModelSize {
  id: number;
  model_type: number;
  size: number;
  type: ModelSizeType;
  sorting: number | null;
  is_delete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ModelSizeListResponse {
  pagination: PaginationMeta;
  results: ModelSize[];
  filters: unknown;
}

export interface ModelSizeQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  ordering?: string;
  is_delete?: boolean;
}

export const modelSizeService = {
  // Get all model sizes
  getModelSizes: async (params?: ModelSizeQueryParams) => {
    return api.get<ModelSizeListResponse>(API_ENDPOINTS.modelSizes.list, {
      params,
    });
  },

  // Get model size by ID
  getModelSizeById: async (id: number) => {
    return api.get<ModelSize>(API_ENDPOINTS.modelSizes.byId(id.toString()));
  },

  // Create model size
  createModelSize: async (data: Partial<ModelSize>) => {
    return api.post<ModelSize>(API_ENDPOINTS.modelSizes.create, data);
  },

  // Update model size
  updateModelSize: async (id: number, data: Partial<ModelSize>) => {
    return api.patch<ModelSize>(API_ENDPOINTS.modelSizes.update(id.toString()), data);
  },

  // Delete model size
  deleteModelSize: async (id: number) => {
    return api.delete(API_ENDPOINTS.modelSizes.delete(id.toString()));
  },
};
