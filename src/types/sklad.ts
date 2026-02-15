/**
 * Sklad (Warehouse) Types
 *
 * Omborlar jadvali
 */

export interface Sklad {
	id: number;
	name: string;
	filial?: number;
	filial_detail?: {
		id: number;
		name: string;
	};
	region?: number;
	region_detail?: {
		id: number;
		code: string;
		name: string;
	};
	district?: number;
	district_detail?: {
		id: number;
		code: string;
		name: string;
		region: number;
	};
	address?: string;
	phone_number?: string;
	is_active?: boolean;
	is_delete?: boolean;
	sorting?: number | null;
	created_at?: string;
	updated_at?: string;
}

export interface SkladQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	filial?: number;
	region?: number;
	district?: number;
	is_active?: boolean;
	is_delete?: boolean;
}

export interface CreateSkladPayload {
	name: string;
	filial?: number;
	region?: number;
	district?: number;
	address?: string;
	phone_number?: string;
	is_active?: boolean;
	is_delete?: boolean;
	sorting?: number | null;
}

export type UpdateSkladPayload = Partial<CreateSkladPayload>;
