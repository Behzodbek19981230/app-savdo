/**
 * ExchangeRate Types
 *
 * Dollar kursi jadvali
 * table ExchangeRate {
 *   id int [PK]
 *   dollar float
 *   filial int [ref: > Filial.id]
 * }
 */

import { User } from '@/services';

export interface ExchangeRate {
	id: number;
	dollar: number;
	filial: number;
	is_active?: boolean;
	updated_by_detail?: User;
	updated_time?: string;
}

export interface ExchangeRateQueryParams {
	filial?: number;
}

export interface ExchangeRateHistoryQueryParams {
	exchange_rate?: number;
}

export interface ExchangeRateHistory {
	id: number;
	exchange_rate: number;
	exchange_rate_detail?: ExchangeRate;
	old_dollar: string | number;
	new_dollar: string | number;
	filial?: number;
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
		phone_number?: string | null;
		logo?: string | null;
		is_active?: boolean;
		is_delete?: boolean;
		is_head_office?: boolean;
	};
	created_time?: string;
	created_by?: number;
	created_by_detail?: User;
	updated_by?: number;
	updated_by_detail?: User;
	updated_time?: string;
}

export interface CreateExchangeRatePayload {
	dollar: number;
	filial: number;
}

export type UpdateExchangeRatePayload = Partial<CreateExchangeRatePayload>;
