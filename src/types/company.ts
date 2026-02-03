/**
 * Company (Filial) Types
 *
 * Table Filial {
 *   id int [pk, increment]
 *   name varchar
 *   region int [ref: > Region.id]
 *   district int [ref: > District.id]
 *   address text
 *   phone_number varchar
 *   logo varchar
 *   is_active bool
 *   is_delete bool
 * }
 */

export interface Company {
	id: number;
	name: string;
	region: number | null;
	district: number | null;
	address: string | null;
	phone_number: string | null;
	logo: string | null;
	is_active: boolean;
	is_delete: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface CreateCompanyPayload {
	name: string;
	region?: number;
	district?: number;
	address?: string;
	phone_number?: string;
	logo?: File;
	is_active?: boolean;
	is_delete?: boolean;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export interface CompanyQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	is_delete?: boolean;
	is_active?: boolean;
}
