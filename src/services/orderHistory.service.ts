import { api } from '@/lib/api/client';

export interface OrderHistoryClientDetail {
	id: number;
	telegram_id?: string | null;
	full_name?: string | null;
	is_active?: boolean;
	date_of_birthday?: string | null;
	gender?: string | null;
	phone_number?: string | null;
	region?: number | null;
	district?: number | null;
	filial?: number | null;
	total_debt?: string;
	keshbek?: string;
	is_profit_loss?: boolean;
	type?: number;
	is_delete?: boolean;
}

export interface OrderHistoryItem {
	id: number;
	order: number | null;
	order_detail: unknown | null;
	client: number;
	client_detail?: OrderHistoryClientDetail | null;
	employee?: number;
	exchange_rate?: string;
	date?: string | null;
	note?: string;
	all_profit_dollar?: string;
	total_debt_client?: string;
	total_debt_today_client?: string;
	all_product_summa?: string;
	summa_total_dollar?: string;
	summa_dollar?: string;
	summa_naqt?: string;
	summa_kilik?: string;
	summa_terminal?: string;
	summa_transfer?: string;
	discount_amount?: string;
	zdacha_dollar?: string;
	zdacha_som?: string;
	is_delete?: boolean;
	order_status?: boolean;
	update_status?: number;
	is_debtor_product?: boolean;
	status_order_dukon?: boolean;
	status_order_sklad?: boolean;
	driver_info?: string;
	is_karzinka?: boolean;
	created_time?: string;
	created_by?: number;
	created_by_detail?: { id: number; full_name?: string; phone_number?: string };
	order_filial?: number;
	order_filial_detail?: { id: number; name?: string };
	currency?: number | null;
	currency_detail?: { id: number; code?: string; name?: string } | null;
	number?: number;
}

export interface OrderHistoryDateGroup {
	date: string;
	count: number;
	items: OrderHistoryItem[];
}

export interface OrderHistoryListResponse {
	pagination: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: OrderHistoryDateGroup[];
	filters?: unknown;
}

export const orderHistoryService = {
	getList: async (params?: Record<string, unknown>) => {
		return api.get<OrderHistoryListResponse>('/order-history', { params });
	},
};
