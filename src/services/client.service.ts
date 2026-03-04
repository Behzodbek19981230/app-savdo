import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';
import type { Client, ClientQueryParams, CreateClientPayload, UpdateClientPayload } from '@/types/client';

export type { Client, ClientQueryParams, CreateClientPayload, UpdateClientPayload };

export interface ClientListResponse {
	pagination?: PaginationMeta;
	results: Client[];
	filters?: unknown;
}

export const clientService = {
	getClients: async (params?: ClientQueryParams) => {
		return api.get<ClientListResponse>(API_ENDPOINTS.clients.list, { params });
	},

	getClientById: async (id: number) => {
		return api.get<Client>(API_ENDPOINTS.clients.byId(id.toString()));
	},

	createClient: async (data: CreateClientPayload) => {
		return api.post<Client>(API_ENDPOINTS.clients.create, data);
	},

	updateClient: async (id: number, data: UpdateClientPayload) => {
		return api.patch<Client>(API_ENDPOINTS.clients.update(id.toString()), data);
	},

	deleteClient: async (id: number) => {
		return api.delete(API_ENDPOINTS.clients.delete(id.toString()));
	},
};
