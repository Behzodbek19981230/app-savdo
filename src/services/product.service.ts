/**
 * Product Service
 * Mahsulotlar bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

// Enum for Product Type
export enum ProductType {
	DONA = '1',
	KAROBKA = '2',
	KOMPLEKT = '3',
	POCHKA = '4',
}

export const ProductTypeLabels: Record<ProductType, string> = {
	[ProductType.DONA]: 'Dona',
	[ProductType.KAROBKA]: 'Karobka',
	[ProductType.KOMPLEKT]: 'Komplekt',
	[ProductType.POCHKA]: 'Pochka',
};

// Detail Types
export interface CategoryDetail {
	id: number;
	name: string;
	sorting: number | null;
	is_delete: boolean;
}

export interface ModelDetail {
	id: number;
	name: string;
	categories: number[];
	sorting: number | null;
	is_delete: boolean;
}

export interface ModelTypeDetail {
	id: number;
	name: string;
	model: number;
	sorting: number | null;
	is_delete: boolean;
}

export interface ModelSizeDetail {
	id: number;
	model_type: number;
	size: number;
	type: string;
	sorting: number | null;
	is_delete: boolean;
}

export interface ProductAttachment {
	id: number;
	product: number;
	file: string;
}

// Types
export interface Product {
	id: number;
	date: string;
	reserve_limit: number;
	filial: number;
	filial_detail?: {
		id: number;
		name: string;
		region?: number;
		region_detail?: {
			id: number;
			code: string;
			name: string;
		};
		district?: number;
		district_detail?: {
			id: number;
			code: string;
			name: string;
			region: number;
		};
		address?: string;
		phone_number?: string;
		logo?: string | null;
		is_active?: boolean;
		is_delete?: boolean;
	};
	branch: number;
	branch_detail?: {
		id: number;
		name: string;
		sorting?: number;
		is_delete?: boolean;
	};
	model: number;
	model_detail?: {
		id: number;
		name: string;
		branch?: number;
		branch_detail?: {
			id: number;
			name: string;
			sorting?: number;
			is_delete?: boolean;
		};
		sorting?: number;
		is_delete?: boolean;
	};
	type: number;
	type_detail?: {
		id: number;
		name: string;
		madel?: number;
		madel_detail?: {
			id: number;
			name: string;
		};
		sorting?: number;
		is_delete?: boolean;
	};
	size: number;
	size_detail?: {
		id: number;
		product_type: number;
		product_type_detail?: {
			id: number;
			name: string;
		};
		size: number;
		type?: number | null;
		type_detail?: unknown;
		sorting?: number;
		is_delete?: boolean;
	};
	count: number;
	real_price: number | string;
	unit_price: number | string;
	wholesale_price: number | string;
	min_price: number | string;
	note?: string;
	is_delete?: boolean;
	created_at?: string;
	updated_at?: string;
	attachments?: ProductAttachment[];
}

export interface ProductListResponse {
	pagination: PaginationMeta;
	results: Product[];
	filters: unknown;
}

export interface ProductQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	is_delete?: boolean;
	category?: number;
	model?: number;
	model_type?: number;
	type?: string;
}

export const productService = {
	// Get all products
	getProducts: async (params?: ProductQueryParams) => {
		return api.get<ProductListResponse>(API_ENDPOINTS.products.list, {
			params,
		});
	},

	// Get product by ID
	getProductById: async (id: number) => {
		return api.get<Product>(API_ENDPOINTS.products.byId(id.toString()));
	},

	// Create product
	createProduct: async (data: Partial<Product>) => {
		return api.post<Product>(API_ENDPOINTS.products.create, data);
	},

	// Update product
	updateProduct: async (id: number, data: Partial<Product>) => {
		return api.patch<Product>(API_ENDPOINTS.products.update(id.toString()), data);
	},

	// Delete product
	deleteProduct: async (id: number) => {
		return api.delete(API_ENDPOINTS.products.delete(id.toString()));
	},
};
