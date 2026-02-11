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
    madel?: number; // API field for ProductModel ID
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

/** POST /product-type/create body: bitta yoki bir nechta model turi + o'lchamlari */
export interface ProductTypeSizeItem {
    size: string | number;
    unit: string | number;
}

export interface ProductTypeCreateItem {
    madel: number;
    name: string;
    sorting: number;
    product_type_size: ProductTypeSizeItem[];
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

    /** Bulk: model turi + product_type_size ro'yxati. POST /product-type/create */
    createProductTypesBulk: async (data: ProductTypeCreateItem[]) => {
        return api.post<ModelType[]>(API_ENDPOINTS.modelTypes.createBulk, data);
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
