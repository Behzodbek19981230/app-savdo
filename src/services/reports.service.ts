import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface TopClientParams {
	filial_id: number;
	date_from: string;
	date_to: string;
	search?: string;
}

export interface TopClient {
	client_id: number;
	client_full_name: string;
	order_count: number;
	sum_summa_total_dollar: string;
	sum_all_product_summa: string;
	sum_all_profit_dollar: string;
}

export interface TopClientResponse {
	filters: {
		filial_id: number;
		date_from: string;
		date_to: string;
	};
	count: number;
	items: TopClient[];
}

export interface OrderDebtHistoryParams {
	filial_id: number;
	date_from: string;
	date_to: string;
}

export interface OrderDebtHistoryTotal {
	all_product_summa?: string;
	summa_total_dollar: string;
	summa_dollar: string;
	summa_naqt: string;
	summa_kilik: string;
	summa_terminal: string;
	summa_transfer: string;
	discount_amount?: string;
	zdacha_dollar?: string;
	zdacha_som?: string;
}

export interface OrderDebtHistoryOrderItem {
	client_full_name: string;
	date: string;
	summa_total_dollar: string;
	all_product_summa: string;
}

export interface OrderDebtHistoryRepaymentItem {
	client_full_name: string;
	date: string;
	summa_total_dollar: string;
}

export interface OrderDebtHistoryExpenseItem {
	date: string;
	category_name: string;
	summa_total_dollar: string;
	summa_dollar: string;
	summa_naqt: string;
	summa_kilik: string;
	summa_terminal: string;
	summa_transfer: string;
}

export interface OrderDebtHistoryResponse {
	filters: {
		filial_id: number;
		date_from: string;
		date_to: string;
	};
	orders: {
		total: OrderDebtHistoryTotal;
		count: number;
		items: OrderDebtHistoryOrderItem[];
	};
	repayments: {
		total: OrderDebtHistoryTotal;
		count: number;
		items: OrderDebtHistoryRepaymentItem[];
	};
	expenses: {
		total: OrderDebtHistoryTotal;
		count: number;
		items: OrderDebtHistoryExpenseItem[];
	};
}

export interface DebtorItem {
	id: number;
	full_name: string;
	phone_number: string;
	total_debt: string;
	keshbek: string;
	last_order_date: string;
}

export interface DebtorsResponse {
	total_debt_summ: string;
	count: number;
	results: DebtorItem[];
}

export interface SoldProductsHistoryParams {
	filial_id: number;
	date_from?: string;
	date_to?: string;
	page?: number;
	limit?: number;
}

export interface SoldProductsHistoryItem {
	date: string;
	date_label: string;
	orders_count: number;
	all_product_summa: string;
	summa_total_dollar: string;
	all_profit_dollar: string;
}

export interface SoldProductsHistoryResponse {
	pagination: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: SoldProductsHistoryItem[];
	filters: null | Record<string, unknown>;
}

export interface SoldProductsHistoryDetailParams {
	filial_id: number;
	date: string;
}

export interface SoldProductsHistoryDetailOrder {
	id: number;
	client_id: number | null;
	client_name: string;
	employee_id: number;
	employee_name: string;
	time: string;
	datetime: string;
	note: string;
	driver_info: string;
	all_product_summa: string;
	summa_total_dollar: string;
	summa_dollar: string;
	summa_naqt: string;
	summa_kilik: string;
	summa_terminal: string;
	summa_transfer: string;
	all_profit_dollar: string;
}

export interface SoldProductsHistoryDetailTotals {
	summa_total_dollar: number;
	summa_dollar: number;
	summa_naqt: number;
	summa_kilik: number;
	summa_terminal: number;
	summa_transfer: number;
}

export interface SoldProductsHistoryDetailSection<T> {
	count: number;
	results: T[];
	totals: SoldProductsHistoryDetailTotals;
}

export interface SoldProductsHistoryDetailResponse {
	date: string;
	date_label: string;
	filial_id: number;
	client_id: number | null;
	orders: SoldProductsHistoryDetailSection<SoldProductsHistoryDetailOrder>;
	debt_repayments: SoldProductsHistoryDetailSection<SoldProductsHistoryDetailOrder>;
}

export const reportsService = {
	getFilialStatistics: async (params: { filial_id: number; year: number; month?: number | null }) => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		query.append('year', String(params.year));
		if (params.month !== undefined && params.month !== null) query.append('month', String(params.month));

		const res = await api.get<unknown>(`/reports/filial-statistics?${query.toString()}`);
		return res;
	},
	getTopClients: async (params: TopClientParams): Promise<TopClientResponse> => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		query.append('date_from', params.date_from);
		query.append('date_to', params.date_to);
		if (params.search) {
			query.append('search', params.search);
		}

		const res = await api.get<TopClientResponse>(`${API_ENDPOINTS.reports.topClient}?${query.toString()}`);
		return res;
	},
	getOrderDebtHistory: async (params: OrderDebtHistoryParams): Promise<OrderDebtHistoryResponse> => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		query.append('date_from', params.date_from);
		query.append('date_to', params.date_to);

		const res = await api.get<OrderDebtHistoryResponse>(
			`${API_ENDPOINTS.reports.orderDebtHistory}?${query.toString()}`,
		);
		return res;
	},
	getDebtors: async (filial_id: number, search?: string): Promise<DebtorsResponse> => {
		const query = new URLSearchParams();
		query.append('filial_id', String(filial_id));
		if (search) {
			query.append('search', search);
		}

		const res = await api.get<DebtorsResponse>(`${API_ENDPOINTS.reports.debtors}?${query.toString()}`);
		return res;
	},
	getSoldProductsHistory: async (params: SoldProductsHistoryParams): Promise<SoldProductsHistoryResponse> => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		if (params.date_from) query.append('date_from', params.date_from);
		if (params.date_to) query.append('date_to', params.date_to);
		if (params.page) query.append('page', String(params.page));
		if (params.limit) query.append('limit', String(params.limit));

		const res = await api.get<SoldProductsHistoryResponse>(
			`${API_ENDPOINTS.reports.soldProductsHistory}?${query.toString()}`,
		);
		return res;
	},
	getSoldProductsHistoryDetail: async (
		params: SoldProductsHistoryDetailParams,
	): Promise<SoldProductsHistoryDetailResponse> => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		query.append('date', params.date);

		const res = await api.get<SoldProductsHistoryDetailResponse>(
			`${API_ENDPOINTS.reports.soldProductsHistoryDetail}?${query.toString()}`,
		);
		return res;
	},
};

export interface OrdersAndDebtsReportParams {
	filial_id: number;
	date_from?: string;
	date_to?: string;
	client_id?: number;
	page?: number;
	limit?: number;
}

export interface OrdersAndDebtsReportItem {
	id: number;
	client_id: number | null;
	client_name: string;
	employee_name: string;
	all_product_summa: string;
	summa_total_dollar: string;
	summa_dollar: string;
	summa_naqt: string;
	summa_kilik: string;
	summa_terminal: string;
	summa_transfer: string;
	all_profit_dollar: string;
	remaining_debt: string;
	datetime: string;
	type: 'order' | 'debt_repayment';
}

export interface OrdersAndDebtsReportGroup {
	date: string;
	date_label: string;
	items: OrdersAndDebtsReportItem[];
	totals: {
		all_product_summa: number;
		summa_total_dollar: number;
		summa_dollar: number;
		summa_naqt: number;
		summa_kilik: number;
		summa_terminal: number;
		summa_transfer: number;
		all_profit_dollar: number;
		remaining_debt: number;
	};
}

export interface OrdersAndDebtsReportResponse {
	pagination: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: OrdersAndDebtsReportGroup[];
	summary: {
		all_product_summa: number;
		summa_total_dollar: number;
		summa_dollar: number;
		summa_naqt: number;
		summa_kilik: number;
		summa_terminal: number;
		summa_transfer: number;
		all_profit_dollar: number;
		remaining_debt: number;
	} | null;
}

export const ordersAndDebtsReportService = {
	getReport: async (params: OrdersAndDebtsReportParams): Promise<OrdersAndDebtsReportResponse> => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		if (params.date_from) query.append('date_from', params.date_from);
		if (params.date_to) query.append('date_to', params.date_to);
		if (params.client_id) query.append('client_id', String(params.client_id));
		if (params.page) query.append('page', String(params.page));
		if (params.limit) query.append('limit', String(params.limit));

		const res = await api.get<OrdersAndDebtsReportResponse>(
			`${API_ENDPOINTS.reports.ordersAndDebtsReport}?${query.toString()}`,
		);
		return res;
	},
};

export default reportsService;
