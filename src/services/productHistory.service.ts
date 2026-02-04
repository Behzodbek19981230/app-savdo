/**
 * ProductHistory Service
 * Mahsulot tarixi bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
	ProductHistory,
	ProductHistoryQueryParams,
	CreateProductHistoryPayload,
	UpdateProductHistoryPayload,
} from '@/types/productHistory';

export type { ProductHistory, ProductHistoryQueryParams, CreateProductHistoryPayload, UpdateProductHistoryPayload };

export interface ProductHistoryListResponse {
	pagination?: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: ProductHistory[];
}

export const productHistoryService = {
	getProductHistories: async (params?: ProductHistoryQueryParams) => {
		return api.get<ProductHistoryListResponse>(API_ENDPOINTS.productHistories.list, { params });
	},

	getProductHistoryById: async (id: number) => {
		return api.get<ProductHistory>(API_ENDPOINTS.productHistories.byId(id.toString()));
	},

	createProductHistory: async (data: CreateProductHistoryPayload) => {
		return api.post<ProductHistory>(API_ENDPOINTS.productHistories.create, data);
	},

	updateProductHistory: async (id: number, data: UpdateProductHistoryPayload) => {
		return api.patch<ProductHistory>(API_ENDPOINTS.productHistories.update(id.toString()), data);
	},

	deleteProductHistory: async (id: number) => {
		return api.delete(API_ENDPOINTS.productHistories.delete(id.toString()));
	},
};
