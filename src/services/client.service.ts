import { api } from '@/lib/api/client';

export interface ClientItem {
	id: number;
	telegram_id?: string | null;
	full_name?: string | null;
	phone_number?: string | null;
	filial?: number | null;
	filial_detail?: { id: number; name?: string };
}

export interface ClientListResponse {
	pagination: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results: ClientItem[];
}

export const clientService = {
	list: async (params?: Record<string, unknown>) => {
		return api.get<ClientListResponse>('/client', { params });
	},
};
