/**
 * Supplier Types
 *
 * Ta'minotchilar jadvali
 */

export interface Supplier {
	id: number;
	name: string;
	phone?: string;
	address?: string;
	debt?: number;
	is_delete?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface SupplierQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	is_delete?: boolean;
}

export interface CreateSupplierPayload {
	name: string;
	phone?: string;
	address?: string;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;
