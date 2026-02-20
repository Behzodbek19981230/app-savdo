/**
 * Order Service
 * Buyurtma bilan bog'liq barcha API chaqiruvlari
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { District, Region } from './location.service';

// Types
export interface Order {
	id: string;
	customer: string;
	product: string;
	amount: string;
	status: 'completed' | 'pending' | 'cancelled';
	createdAt: string;
}

export interface OrderListResponse {
	data: Order[];
	meta: {
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	};
}

export interface OrderQueryParams {
	page?: number;
	perPage?: number;
	status?: string;
	customerId?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderData {
	customerId: string;
	productId: string;
	quantity: number;
	amount: string;
	status?: 'completed' | 'pending' | 'cancelled';
}
export interface ClientDetail {
	id: number;
	telegram_id?: number | null;
	full_name: string;
	is_active: boolean;
	date_of_birthday?: string | null;
	gender?: string | null;
	phone_number: string;
	region?: number | null;
	region_detail?: Region | null;
	district?: number | null;
	district_detail?: District | null;
	filial: number;
	filial_detail: OrderFilialDetail | null;
	total_debt: string;
	keshbek: string;
	is_profit_loss: boolean;
	type: number;
	is_delete: boolean;
}
export interface OrderResponse {
	id: number;
	order?: number | null;
	order_detail?: any | null;
	client: number;
	client_detail: ClientDetail | null;
	employee: number;
	exchange_rate: string;
	date: string | null;
	note: string;
	all_profit_dollar: string;
	total_debt_client: string;
	total_debt_today_client: string;
	all_product_summa: string;
	summa_total_dollar: string;
	summa_dollar: string;
	summa_naqt: string;
	summa_kilik: string;
	summa_terminal: string;
	summa_transfer: string;
	discount_amount: string;
	zdacha_dollar: string;
	zdacha_som: string;
	is_delete: boolean;
	order_status: boolean;
	update_status: number;
	is_debtor_product: boolean;
	status_order_dukon: boolean;
	status_order_sklad: boolean;
	driver_info: string;
	is_karzinka: boolean;
	created_time?: string | null;
	created_by?: number | null;
	created_by_detail?: {
		id: number;
		name: string;
		full_name: string;
		phone_number?: string | null;
	} | null;
	order_filial?: number | null;
	order_filial_detail?: OrderFilialDetail | null;
	currency?: number | null;
}
export interface OrderFilialDetail {
	id: number;
	name: string;
	region?: number;
	district?: number;
	address?: string;
	phone_number?: string | null;
	logo?: string | null;
	is_active?: boolean;
	is_delete?: boolean;
}

export type UpdateOrderData = Partial<CreateOrderData>;

// Order Service
export const orderService = {
	/**
	 * Get all orders
	 */
	getAll: async (params?: OrderQueryParams): Promise<OrderListResponse> => {
		return api.get<OrderListResponse>(API_ENDPOINTS.orders.list, {
			params,
		});
	},

	/**
	 * Get recent orders
	 */
	getRecent: async (limit = 5): Promise<Order[]> => {
		return api.get<Order[]>(API_ENDPOINTS.orders.recent, {
			params: { limit },
		});
	},

	/**
	 * Get order by ID
	 */
	getById: async (id: string): Promise<Order> => {
		return api.get<Order>(API_ENDPOINTS.orders.byId(id));
	},
	// Order-history product-by-model olish
	getOrderProductsByModel: async (
		orderHistoryId: number,
	): Promise<{
		order_history: OrderResponse;
		products: Array<{
			model_id: number;
			model: string;
			product: any[];
		}>;
	}> => {
		const response = await api.get<{
			order_history: OrderResponse;
			products: Array<{
				model_id: number;
				model: string;
				product: any[];
			}>;
		}>(`/order-history/${orderHistoryId}/product-by-model`);
		return response as any;
	},

	/**
	 * Create new order
	 */
	create: async (data: CreateOrderData): Promise<Order> => {
		return api.post<Order>(API_ENDPOINTS.orders.create, data);
	},

	/**
	 * Update order
	 */
	update: async (id: string, data: UpdateOrderData): Promise<Order> => {
		return api.put<Order>(API_ENDPOINTS.orders.update(id), data);
	},

	/**
	 * Delete order
	 */
	delete: async (id: string): Promise<void> => {
		return api.delete(API_ENDPOINTS.orders.delete(id));
	},
};
