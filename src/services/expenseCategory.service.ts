/**
 * Expense Category Service
 * Xarajat kategoriyalari bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface ExpenseCategory {
	id: number;
	name: string;
	is_delete?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface PaginationMeta {
	currentPage: number;
	lastPage: number;
	perPage: number;
	total: number;
}

export interface ExpenseCategoryListResponse {
	pagination: PaginationMeta;
	results: ExpenseCategory[];
	filters: unknown;
}

export interface ExpenseCategoryQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	is_delete?: boolean;
}

export const expenseCategoryService = {
	// Get all categories
	getCategories: async (params?: ExpenseCategoryQueryParams) => {
		return api.get<ExpenseCategoryListResponse>(API_ENDPOINTS.expenseCategories.list, {
			params,
		});
	},

	// Get category by ID
	getCategoryById: async (id: string) => {
		return api.get<ExpenseCategory>(API_ENDPOINTS.expenseCategories.byId(id));
	},

	// Create category
	createCategory: async (data: Partial<ExpenseCategory>) => {
		return api.post<ExpenseCategory>(API_ENDPOINTS.expenseCategories.create, data);
	},

	// Update category
	updateCategory: async (id: number, data: Partial<ExpenseCategory>) => {
		return api.patch<ExpenseCategory>(API_ENDPOINTS.expenseCategories.update(id.toString()), data);
	},

	// Delete category
	deleteCategory: async (id: number) => {
		return api.delete(API_ENDPOINTS.expenseCategories.delete(id.toString()));
	},
};
