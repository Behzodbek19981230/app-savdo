import { api } from '@/lib/api/client';

export interface OrderHistoryProductItem {
	id: number;
	date?: string | null;
	order_history: number;
	order_history_detail?: unknown;
	product: number;
	product_detail?: {
		id: number;
		date?: string;
		reserve_limit?: number;
		filial?: number;
		branch?: number;
		branch_category?: number;
		model?: number;
		type?: number;
		size?: number | null;
		count?: number;
		real_price?: string;
		unit_price?: string;
		wholesale_price?: string;
		min_price?: string;
		note?: string;
		is_delete?: boolean;
	};
	branch?: number;
	branch_detail?: { id: number; name?: string };
	model?: number;
	model_detail?: { id: number; name?: string };
	type?: number;
	type_detail?: { id: number; name?: string };
	size?: number | null;
	size_detail?: unknown | null;
	count?: number;
	given_count?: number;
	real_price?: string;
	unit_price?: string;
	wholesale_price?: string;
	is_delete?: boolean;
}

export interface OrderHistoryProductListResponse {
	pagination: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: OrderHistoryProductItem[];
	filters?: unknown;
}

export const orderHistoryProductService = {
	list: async (params?: Record<string, unknown>) => {
		return api.get<OrderHistoryProductListResponse>('/order-history-product', { params });
	},
	// Fetch products grouped by model for a specific order history
	byModel: async (orderHistoryId: number | string) => {
		return api.get<any>(`/order-history/${orderHistoryId}/product-by-model`);
	},
};
