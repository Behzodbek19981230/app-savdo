/**
 * Sklad (Warehouse) Service
 * Omborlar bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Sklad, SkladQueryParams, CreateSkladPayload, UpdateSkladPayload } from '@/types/sklad';

export type { Sklad, SkladQueryParams, CreateSkladPayload, UpdateSkladPayload };

export interface SkladListResponse {
	pagination?: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: Sklad[];
}

export const skladService = {
	getSklads: async (params?: SkladQueryParams) => {
		return api.get<SkladListResponse>(API_ENDPOINTS.sklads.list, { params });
	},

	getSkladById: async (id: number) => {
		return api.get<Sklad>(API_ENDPOINTS.sklads.byId(id.toString()));
	},

	createSklad: async (data: CreateSkladPayload) => {
		return api.post<Sklad>(API_ENDPOINTS.sklads.create, data);
	},

	updateSklad: async (id: number, data: UpdateSkladPayload) => {
		return api.patch<Sklad>(API_ENDPOINTS.sklads.update(id.toString()), data);
	},

	deleteSklad: async (id: number) => {
		return api.delete(API_ENDPOINTS.sklads.delete(id.toString()));
	},
};
