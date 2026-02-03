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

export interface ExchangeRate {
	id: number;
	dollar: number;
	filial: number;
	created_at?: string;
	updated_at?: string;
}

export interface ExchangeRateQueryParams {
	filial?: number;
}

export interface CreateExchangeRatePayload {
	dollar: number;
	filial: number;
}

export type UpdateExchangeRatePayload = Partial<CreateExchangeRatePayload>;
