/**
 * Product Model Service
 * Mahsulot modellari bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta, ProductCategory } from './productCategory.service';

// Types
export interface ProductModel {
	id: number;
	name: string;
	category?: number[];
	category_detail?: ProductCategory[]; // Product Category IDs (optional in list response)
	sorting: number | null;
	is_delete: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface ProductModelListResponse {
	pagination: PaginationMeta;
	results: ProductModel[];
	filters: unknown;
}

export interface ProductModelQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	is_delete?: boolean;
}

export const productModelService = {
	// Get all models
	getModels: async (params?: ProductModelQueryParams) => {
		return api.get<ProductModelListResponse>(API_ENDPOINTS.productModels.list, {
			params,
		});
	},

	// Get model by ID
	getModelById: async (id: number) => {
		return api.get<ProductModel>(API_ENDPOINTS.productModels.byId(id.toString()));
	},

	// Create model
	createModel: async (data: Partial<ProductModel>) => {
		return api.post<ProductModel>(API_ENDPOINTS.productModels.create, data);
	},

	// Update model
	updateModel: async (id: number, data: Partial<ProductModel>) => {
		return api.patch<ProductModel>(API_ENDPOINTS.productModels.update(id.toString()), data);
	},

	// Delete model
	deleteModel: async (id: number) => {
		return api.delete(API_ENDPOINTS.productModels.delete(id.toString()));
	},
};
