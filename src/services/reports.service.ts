import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export interface TopClientParams {
    filial_id: number;
    date_from: string;
    date_to: string;
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

        const res = await api.get<TopClientResponse>(`${API_ENDPOINTS.reports.topClient}?${query.toString()}`);
        return res;
    },
    getOrderDebtHistory: async (params: OrderDebtHistoryParams): Promise<OrderDebtHistoryResponse> => {
        const query = new URLSearchParams();
        query.append('filial_id', String(params.filial_id));
        query.append('date_from', params.date_from);
        query.append('date_to', params.date_to);

        const res = await api.get<OrderDebtHistoryResponse>(`${API_ENDPOINTS.reports.orderDebtHistory}?${query.toString()}`);
        return res;
    },
    getDebtors: async (filial_id: number, client_id?: number): Promise<DebtorsResponse> => {
        const query = new URLSearchParams();
        query.append('filial_id', String(filial_id));
        if (client_id) {
            query.append('client_id', String(client_id));
        }

        const res = await api.get<DebtorsResponse>(`${API_ENDPOINTS.reports.debtors}?${query.toString()}`);
        return res;
    },
};

export default reportsService;
