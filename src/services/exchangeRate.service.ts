/**
 * ExchangeRate Service
 * Dollar kursi bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
	ExchangeRate,
	ExchangeRateQueryParams,
	CreateExchangeRatePayload,
	UpdateExchangeRatePayload,
} from '@/types/exchangeRate';

export type { ExchangeRate, ExchangeRateQueryParams, CreateExchangeRatePayload, UpdateExchangeRatePayload };

export interface ExchangeRateListResponse {
	pagination?: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: ExchangeRate[];
}

export const exchangeRateService = {
	getExchangeRates: async (params?: ExchangeRateQueryParams) => {
		return api.get<ExchangeRateListResponse>(API_ENDPOINTS.exchangeRate.list, { params });
	},

	getExchangeRateById: async (id: number) => {
		return api.get<ExchangeRate>(API_ENDPOINTS.exchangeRate.byId(id.toString()));
	},

	createExchangeRate: async (data: CreateExchangeRatePayload) => {
		return api.post<ExchangeRate>(API_ENDPOINTS.exchangeRate.create, data);
	},

	updateExchangeRate: async (id: number, data: UpdateExchangeRatePayload) => {
		return api.patch<ExchangeRate>(API_ENDPOINTS.exchangeRate.update(id.toString()), data);
	},

	deleteExchangeRate: async (id: number) => {
		return api.delete(API_ENDPOINTS.exchangeRate.delete(id.toString()));
	},
};
