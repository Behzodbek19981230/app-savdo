/**
 * PurchaseInvoice Types
 *
 * Ta'minotchidan tovar kirimi (faktura)
 * Table PurchaseInvoice {
 *   id int [pk, increment]
 *   type int // tovar kirimi / Vozvrad qilish
 *   employee int [ref: > User.id]
 *   supplier int [ref: > Supplier.id]
 *   filial int [ref: > Filial.id]
 *   sklad int [ref: > Sklad.id]
 *   date date
 *   total_debt_old float // Eski qarz
 *   total_debt float // Qolgan qarz
 *   total_debt_today float // Bugungi qolgan qarz
 *   product_count int
 *   all_product_summa float
 *   given_summa_total_dollar float // Umumiy berilgan summa dollarda
 *   given_summa_dollar float // Berilgan summa dollarda
 *   given_summa_naqt float // Berilgan summa naqtda
 *   given_summa_kilik float // Berilgan summa kilikda
 *   given_summa_terminal float // Berilgan summa terminalda
 *   given_summa_transfer float // Berilgan summa transferda
 * }
 */

export interface PurchaseInvoice {
	id: number;
	type: number; // 0 - tovar kirimi, 1 - vozvrat
	employee: number;
	employee_detail?: {
		id: number;
		fullname: string;
		username: string;
	};
	supplier: number;
	supplier_detail?: {
		id: number;
		name: string;
	};
	filial: number;
	filial_detail?: {
		id: number;
		name: string;
	};
	sklad: number;
	sklad_detail?: {
		id: number;
		name: string;
	};
	date: string;
	total_debt_old: number;
	total_debt: number;
	total_debt_today: number;
	product_count: number;
	all_product_summa: number;
	given_summa_total_dollar: number;
	given_summa_dollar: number;
	given_summa_naqt: number;
	given_summa_kilik: number;
	given_summa_terminal: number;
	given_summa_transfer: number;
	created_at?: string;
	updated_at?: string;
}

export interface PurchaseInvoiceQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	type?: number;
	filial?: number;
	supplier?: number;
	date_from?: string;
	date_to?: string;
}

export interface CreatePurchaseInvoicePayload {
	type: number;
	employee: number;
	supplier: number;
	filial: number;
	sklad: number;
	date: string;
	total_debt_old?: number;
	total_debt?: number;
	total_debt_today?: number;
	product_count?: number;
	all_product_summa?: number;
	given_summa_total_dollar?: number;
	given_summa_dollar?: number;
	given_summa_naqt?: number;
	given_summa_kilik?: number;
	given_summa_terminal?: number;
	given_summa_transfer?: number;
}

export type UpdatePurchaseInvoicePayload = Partial<CreatePurchaseInvoicePayload>;
