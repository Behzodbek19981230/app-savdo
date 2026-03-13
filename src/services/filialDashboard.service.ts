import { api } from '@/lib/api/client';

export interface FilialDashboardCardCount {
    clients_count: number;
    debtors_count: number;
    karzinka_orders_count: number;
    users_count: number;
}

export interface FilialDashboardMonthlyItem {
    month: string;
    order_sum_usd: string;
    debt_sum_usd: string;
    profit_sum_usd: string;
}

export interface FilialDashboardResponse {
    filial_id: number;
    card_count: FilialDashboardCardCount;
    monthly: FilialDashboardMonthlyItem[];
}

export const filialDashboardService = {
    get: async (filialId: number) => {
        return api.get<FilialDashboardResponse>('/reports/filial-dashboard', {
            params: { filial_id: filialId },
        });
    },
};
