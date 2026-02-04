/**
 * PurchaseInvoice Service
 * Faktura (tovar kirimi) bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
	PurchaseInvoice,
	PurchaseInvoiceQueryParams,
	CreatePurchaseInvoicePayload,
	UpdatePurchaseInvoicePayload,
} from '@/types/purchaseInvoice';

export type { PurchaseInvoice, PurchaseInvoiceQueryParams, CreatePurchaseInvoicePayload, UpdatePurchaseInvoicePayload };

export interface PurchaseInvoiceListResponse {
	pagination?: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: PurchaseInvoice[];
}

export const purchaseInvoiceService = {
	getPurchaseInvoices: async (params?: PurchaseInvoiceQueryParams) => {
		return api.get<PurchaseInvoiceListResponse>(API_ENDPOINTS.purchaseInvoices.list, { params });
	},

	getPurchaseInvoiceById: async (id: number) => {
		return api.get<PurchaseInvoice>(API_ENDPOINTS.purchaseInvoices.byId(id.toString()));
	},

	createPurchaseInvoice: async (data: CreatePurchaseInvoicePayload) => {
		return api.post<PurchaseInvoice>(API_ENDPOINTS.purchaseInvoices.create, data);
	},

	updatePurchaseInvoice: async (id: number, data: UpdatePurchaseInvoicePayload) => {
		return api.patch<PurchaseInvoice>(API_ENDPOINTS.purchaseInvoices.update(id.toString()), data);
	},

	deletePurchaseInvoice: async (id: number) => {
		return api.delete(API_ENDPOINTS.purchaseInvoices.delete(id.toString()));
	},
};
