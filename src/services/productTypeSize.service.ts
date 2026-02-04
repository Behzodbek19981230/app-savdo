/**
 * Product Type Size Service
 * Mahsulot turi o'lchamlari bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

// Types
export interface ProductTypeSize {
	id: number;
	product_type?: number; // ProductType ID
	size: number; // float
	unit?: number; // Unit ID
	unit_detail?: {
		id: number;
		code: string;
		name: string;
	};
	sorting: number | null;
	is_delete: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface ProductTypeSizeListResponse {
	pagination: PaginationMeta;
	results: ProductTypeSize[];
	filters: unknown;
}

export interface ProductTypeSizeQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	is_delete?: boolean;
	product_type?: number; // Filter by product type
}

export const productTypeSizeService = {
	// Get all product type sizes
	getProductTypeSizes: async (params?: ProductTypeSizeQueryParams) => {
		return api.get<ProductTypeSizeListResponse>(API_ENDPOINTS.productTypeSizes.list, {
			params,
		});
	},

	// Get product type size by ID
	getProductTypeSizeById: async (id: number) => {
		return api.get<ProductTypeSize>(API_ENDPOINTS.productTypeSizes.byId(id.toString()));
	},

	// Create product type size
	createProductTypeSize: async (data: Partial<ProductTypeSize>) => {
		return api.post<ProductTypeSize>(API_ENDPOINTS.productTypeSizes.create, data);
	},

	// Update product type size
	updateProductTypeSize: async (id: number, data: Partial<ProductTypeSize>) => {
		return api.patch<ProductTypeSize>(API_ENDPOINTS.productTypeSizes.update(id.toString()), data);
	},

	// Delete product type size
	deleteProductTypeSize: async (id: number) => {
		return api.delete(API_ENDPOINTS.productTypeSizes.delete(id.toString()));
	},
};
