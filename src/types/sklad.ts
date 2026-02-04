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
	address?: string;
	is_delete?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface SkladQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	filial?: number;
	is_delete?: boolean;
}

export interface CreateSkladPayload {
	name: string;
	filial?: number;
	address?: string;
}

export type UpdateSkladPayload = Partial<CreateSkladPayload>;
