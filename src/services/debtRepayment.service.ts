import { api } from '@/lib/api/client';

export const debtRepaymentService = {
	// Fetch debt korzinka list
	korzinka: async (params?: Record<string, unknown>) => {
		return api.get<any>('/debt-repayment/karzinka', { params });
	},

	// Delete a debt korzinka item
	deleteKorzinka: async (id: number | string) => {
		return api.delete(`/debt-repayment/karzinka/${id}`);
	},

	// Restore a debt korzinka item back to repayments
	restoreKorzinka: async (id: number | string) => {
		return api.post(`/debt-repayment/karzinka/${id}/restore`);
	},

	// Get single debt repayment (detail)
	getById: async (id: number | string) => {
		return api.get(`/debt-repayment/karzinka/${id}`);
	},
};
