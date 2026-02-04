/**
 * Supplier Service
 * Ta'minotchilar bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Supplier, SupplierQueryParams, CreateSupplierPayload, UpdateSupplierPayload } from '@/types/supplier';

export type { Supplier, SupplierQueryParams, CreateSupplierPayload, UpdateSupplierPayload };

export interface SupplierListResponse {
	pagination?: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: Supplier[];
}

export const supplierService = {
	getSuppliers: async (params?: SupplierQueryParams) => {
		return api.get<SupplierListResponse>(API_ENDPOINTS.suppliers.list, { params });
	},

	getSupplierById: async (id: number) => {
		return api.get<Supplier>(API_ENDPOINTS.suppliers.byId(id.toString()));
	},

	createSupplier: async (data: CreateSupplierPayload) => {
		return api.post<Supplier>(API_ENDPOINTS.suppliers.create, data);
	},

	updateSupplier: async (id: number, data: UpdateSupplierPayload) => {
		return api.patch<Supplier>(API_ENDPOINTS.suppliers.update(id.toString()), data);
	},

	deleteSupplier: async (id: number) => {
		return api.delete(API_ENDPOINTS.suppliers.delete(id.toString()));
	},
};
