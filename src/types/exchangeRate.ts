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
	updated_by_detail?: User;
	updated_time?: string;
}

export interface ExchangeRateQueryParams {
	filial?: number;
}

export interface CreateExchangeRatePayload {
	dollar: number;
	filial: number;
}

export type UpdateExchangeRatePayload = Partial<CreateExchangeRatePayload>;
