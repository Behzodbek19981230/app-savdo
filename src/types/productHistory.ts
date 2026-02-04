/**
 * ProductHistory Types
 *
 * Mahsulotlar Tarixi Jadvali (Kirim bo'lgan mahsulotlar)
 * Table ProductHistory {
 *   id int [pk, increment]
 *   date date
 *   reserve_limit int // Zaxira limiti
 *   product int [ref: > Product.id]
 *   purchase_invoice int [ref: > PurchaseInvoice.id]
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
	product: number;
	product_detail?: {
		id: number;
		name: string;
		barcode?: string;
	};
	purchase_invoice: number;
	purchase_invoice_detail?: {
		id: number;
		date: string;
	};
	branch: number;
	branch_detail?: {
		id: number;
		name: string;
	};
	model: number;
	model_detail?: {
		id: number;
		name: string;
	};
	type: number;
	type_detail?: {
		id: number;
		name: string;
	};
	size: number;
	size_detail?: {
		id: number;
		name: string;
	};
	unit: number;
	unit_detail?: {
		id: number;
		code: string;
		name: string;
	};
	is_weight: boolean;
	count: number;
	real_price: number;
	unit_price: number;
	wholesale_price: number;
	min_price: number;
	note?: string;
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
