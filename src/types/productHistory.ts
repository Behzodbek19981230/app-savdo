/**
 * ProductHistory Types
 *
 * Mahsulotlar Tarixi Jadvali (Kirim bo'lgan mahsulotlar)
 * Table ProductHistory {
 *   id int [pk, increment]
 *   date date
 *   reserve_limit int // Zaxira limiti
 *   filial int [ref: > Filial.id]
 *   branch int [ref: > ProductBranch.id]
 *   model int [ref: > ProductModel.id]
 *   type int [ref: > ProductType.id]
 *   size int [ref: > ProductTypeSize.id]
 *   count int
 *   real_price float // Xaqiqiy narxi (tannarx)
 *   unit_price float // Dona narxi
 *   wholesale_price float // Optom narxi
 *   min_price float // Minimal narxi
 *   note text // Izoh
 * }
 */

export interface ProductHistory {
	id: number;
	date: string;
	reserve_limit: number;
	filial: number;
	filial_detail?: {
		id: number;
		name: string;
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
		logo?: string | null;
		is_active?: boolean;
		is_delete?: boolean;
	};
	branch: number;
	branch_detail?: {
		id: number;
		name: string;
		sorting?: number;
		is_delete?: boolean;
	};
	model: number;
	model_detail?: {
		id: number;
		name: string;
		branch?: number;
		branch_detail?: {
			id: number;
			name: string;
			sorting?: number;
			is_delete?: boolean;
		};
		sorting?: number;
		is_delete?: boolean;
	};
	type: number;
	type_detail?: {
		id: number;
		name: string;
		madel?: number;
		madel_detail?: {
			id: number;
			name: string;
		};
		sorting?: number;
		is_delete?: boolean;
	};
	size: number;
	size_detail?: {
		id: number;
		product_type: number;
		product_type_detail?: {
			id: number;
			name: string;
		};
		size: number;
		type?: number | null;
		type_detail?: unknown;
		sorting?: number;
		is_delete?: boolean;
	};
	count: number;
	real_price: number | string;
	unit_price: number | string;
	wholesale_price: number | string;
	min_price: number | string;
	note?: string;
	is_delete?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface ProductHistoryQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	purchase_invoice?: number;
	product?: number;
	branch?: number;
	model?: number;
	type?: number;
}

export interface CreateProductHistoryPayload {
	date: string;
	reserve_limit: number;
	product?: number;
	purchase_invoice: number;
	branch: number;
	model: number;
	type: number;
	size: number;
	unit: number;
	is_weight: boolean;
	count: number;
	real_price: number;
	unit_price: number;
	wholesale_price: number;
	min_price: number;
	note?: string;
	filial_id?: number;
}

export type UpdateProductHistoryPayload = Partial<CreateProductHistoryPayload>;
