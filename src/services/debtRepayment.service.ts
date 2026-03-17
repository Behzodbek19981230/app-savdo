/**
 * Debt Repayment Service
 * To'langan qarzlar bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface DebtRepaymentRequest {
	filial: number;
	client: number;
	employee: number;
	exchange_rate: number;
	date: string;
	note?: string;
	old_total_debt_client: number;
	total_debt_client: number;
	summa_total_dollar: number;
	summa_dollar: number;
	summa_naqt: number;
	summa_kilik: number;
	summa_terminal: number;
	summa_transfer: number;
	discount_amount: number;
	zdacha_dollar: number;
	zdacha_som: number;
	is_delete?: boolean;
	debt_status: boolean;
}

export const debtRepaymentService = {
	// Get grouped by date
	getGroupedByDate: async (params?: Record<string, unknown>) => {
		return api.get(API_ENDPOINTS.debtRepayment.listGroupedByDate, { params });
	},

	// List
	getList: async (params?: Record<string, unknown>) => {
		return api.get(API_ENDPOINTS.debtRepayment.list, { params });
	},

	// Create
	createDebtRepayment: async (data: DebtRepaymentRequest) => {
		return api.post(API_ENDPOINTS.debtRepayment.create, data);
	},

	// Update
	updateDebtRepayment: async (id: number, data: Partial<DebtRepaymentRequest>) => {
		return api.patch(API_ENDPOINTS.debtRepayment.update(id.toString()), data);
	},

	// Delete
	deleteDebtRepayment: async (id: number) => {
		return api.delete(API_ENDPOINTS.debtRepayment.delete(id.toString()));
	},

	// Korzinka (cart) helpers
	korzinka: async (params?: Record<string, unknown>) => {
		return api.get<any>('/debt-repayment/karzinka', { params });
	},
	deleteKorzinka: async (id: number | string) => {
		return api.delete(`/debt-repayment/karzinka/${id}`);
	},
	restoreKorzinka: async (id: number | string) => {
		return api.post(`/debt-repayment/karzinka/${id}/restore`);
	},
	getById: async (id: number | string) => {
		return api.get(`/debt-repayment/karzinka/${id}`);
	},
};
