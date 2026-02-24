/**
 * Expense Service
 * Xarajatlar bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface Expense {
	id: number;
	filial?: number;
	category?: number;
	summa_total_dollar?: number;
	summa_dollar?: number;
	summa_naqt?: number;
	summa_kilik?: number;
	summa_terminal?: number;
	summa_transfer?: number;
	date?: string;
	note?: string;
	is_delete?: boolean;
	is_salary?: boolean;
	employee?: number;
	created_at?: string;
	updated_at?: string;
	category_detail?: { id: number; name?: string };
	employee_detail?: { full_name?: string; phone_number?: string };
}

export interface CreateExpensePayload {
	filial?: number;
	category?: number;
	summa_total_dollar?: number;
	summa_dollar?: number;
	summa_naqt?: number;
	summa_kilik?: number;
	summa_terminal?: number;
	summa_transfer?: number;
	date?: string;
	note?: string;
	is_delete?: boolean;
	is_salary?: boolean;
	employee?: number;
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export const expenseService = {
	// Get all expenses
	getExpenses: async (params?: Record<string, unknown>) => {
		return api.get<Expense[]>(API_ENDPOINTS.expenses.list, { params });
	},

	// Get expense by ID
	getExpenseById: async (id: number) => {
		return api.get<Expense>(API_ENDPOINTS.expenses.byId(id.toString()));
	},

	// Create expense
	createExpense: async (data: CreateExpensePayload) => {
		return api.post<Expense>(API_ENDPOINTS.expenses.create, data);
	},

	// Update expense
	updateExpense: async (id: number, data: UpdateExpensePayload) => {
		return api.patch<Expense>(API_ENDPOINTS.expenses.update(id.toString()), data);
	},

	// Delete expense
	deleteExpense: async (id: number) => {
		return api.delete(API_ENDPOINTS.expenses.delete(id.toString()));
	},
};
