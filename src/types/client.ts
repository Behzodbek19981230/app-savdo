/**
 * Client Types
 * /client endpoint
 */

export type ClientType = 'dona' | 'optom' | 'dokon' | 'hamkor';

export interface Client {
	id: number;
	telegram_id?: number | null;
	full_name: string;
	is_active?: boolean;
	date_of_birthday?: string | null;
	gender?: string | null;
	phone_number?: string | null;
	region?: number | null;
	region_detail?: {
		id: number;
		code?: string;
		name?: string;
	};
	district?: number | null;
	district_detail?: {
		id: number;
		code?: string;
		name?: string;
		region?: number;
	};
	filial?: number | null;
	filial_detail?: {
		id: number;
		name?: string;
	};
	total_debt?: number | string | null;
	keshbek?: number | string | null;
	is_profit_loss?: boolean;
	type?: ClientType | null;
	is_delete?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface ClientQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	ordering?: string;
	is_active?: boolean;
	is_delete?: boolean;
	filial?: number;
	region?: number;
	district?: number;
	type?: ClientType;
}

export interface CreateClientPayload {
	telegram_id?: number;
	full_name: string;
	is_active?: boolean;
	date_of_birthday?: string;
	gender?: string;
	phone_number?: string;
	region: number;
	district: number;
	filial: number;
	total_debt?: number;
	keshbek?: number;
	type?: ClientType;
	is_delete?: boolean;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;
