/**
 * Unit Service
 * O'lchov birliklari (kg, ta, dona, metr, etc.) bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

// Types
export interface Unit {
	id: number;
	code: string;
	name: string;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface UnitListResponse {
	pagination: PaginationMeta;
	results: Unit[];
	filters: unknown;
}

export interface UnitQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	is_active?: boolean;
}

export const unitService = {
	// Get all units
	getUnits: async (params?: UnitQueryParams) => {
		return api.get<UnitListResponse>(API_ENDPOINTS.units.list, {
			params,
		});
	},

	// Get unit by ID
	getUnitById: async (id: number) => {
		return api.get<Unit>(API_ENDPOINTS.units.byId(id.toString()));
	},

	// Create unit
	createUnit: async (data: Partial<Unit>) => {
		return api.post<Unit>(API_ENDPOINTS.units.create, data);
	},

	// Update unit
	updateUnit: async (id: number, data: Partial<Unit>) => {
		return api.patch<Unit>(API_ENDPOINTS.units.update(id.toString()), data);
	},

	// Delete unit
	deleteUnit: async (id: number) => {
		return api.delete(API_ENDPOINTS.units.delete(id.toString()));
	},
};
