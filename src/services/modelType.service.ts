/**
 * Model Type Service
 * Mahsulot model turlari bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';
import { ProductModel } from './productModel.service';

// Types
export interface ModelType {
    id: number;
    name: string;
    madel_detail?: ProductModel; // ProductModel ID (note: API uses 'madel' not 'model')
    model?: number; // alias for madel
    sorting: number | null;
    is_delete: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ModelTypeListResponse {
    pagination: PaginationMeta;
    results: ModelType[];
    filters: unknown;
}

export interface ModelTypeQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    ordering?: string;
    is_delete?: boolean;
    madel?: number; // Filter by model
}

export const modelTypeService = {
    // Get all model types
    getModelTypes: async (params?: ModelTypeQueryParams) => {
        return api.get<ModelTypeListResponse>(API_ENDPOINTS.modelTypes.list, {
            params,
        });
    },

    // Get model type by ID
    getModelTypeById: async (id: number) => {
        return api.get<ModelType>(API_ENDPOINTS.modelTypes.byId(id.toString()));
    },

    // Create model type
    createModelType: async (data: Partial<ModelType>) => {
        return api.post<ModelType>(API_ENDPOINTS.modelTypes.create, data);
    },

    // Update model type
    updateModelType: async (id: number, data: Partial<ModelType>) => {
        return api.patch<ModelType>(API_ENDPOINTS.modelTypes.update(id.toString()), data);
    },

    // Delete model type
    deleteModelType: async (id: number) => {
        return api.delete(API_ENDPOINTS.modelTypes.delete(id.toString()));
    },
};
