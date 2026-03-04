import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	clientService,
	type Client,
	type ClientListResponse,
	type ClientQueryParams,
	type CreateClientPayload,
	type UpdateClientPayload,
} from '@/services/client.service';

const formatErrorMessage = (error: unknown): string => {
	if (error && typeof error === 'object' && 'message' in error) {
		const errorObj = error as { message: unknown };

		if (errorObj.message && typeof errorObj.message === 'object') {
			const messages: string[] = [];
			Object.entries(errorObj.message).forEach(([field, value]) => {
				if (Array.isArray(value)) value.forEach((msg) => messages.push(`${field}: ${msg}`));
				else if (typeof value === 'string') messages.push(`${field}: ${value}`);
			});
			if (messages.length > 0) return messages.join('\n');
		}

		if ('errorMessage' in error && typeof (error as { errorMessage: unknown }).errorMessage === 'string') {
			return (error as { errorMessage: string }).errorMessage;
		}
		if (typeof errorObj.message === 'string') return errorObj.message;
	}
	return "Noma'lum xatolik yuz berdi";
};

export const CLIENTS_KEYS = {
	all: ['clients'] as const,
	lists: () => [...CLIENTS_KEYS.all, 'list'] as const,
	list: (params?: ClientQueryParams) => [...CLIENTS_KEYS.lists(), params] as const,
	details: () => [...CLIENTS_KEYS.all, 'detail'] as const,
	detail: (id: number) => [...CLIENTS_KEYS.details(), id] as const,
};

export function useClients(params?: ClientQueryParams) {
	return useQuery<ClientListResponse>({
		queryKey: CLIENTS_KEYS.list(params),
		queryFn: () => clientService.getClients(params),
		keepPreviousData: true,
	});
}

export const useClient = (id: number) => {
	return useQuery<Client>({
		queryKey: CLIENTS_KEYS.detail(id),
		queryFn: () => clientService.getClientById(id),
		enabled: !!id,
	});
};

export const useCreateClient = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateClientPayload) => clientService.createClient(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CLIENTS_KEYS.lists() });
			toast.success("Mijoz muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdateClient = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateClientPayload }) => clientService.updateClient(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: CLIENTS_KEYS.lists() });
			queryClient.invalidateQueries({ queryKey: CLIENTS_KEYS.detail(id) });
			toast.success('Mijoz muvaffaqiyatli yangilandi');
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeleteClient = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => clientService.deleteClient(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CLIENTS_KEYS.lists() });
			toast.success("Mijoz muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const toClientFormDefaults = (c: Client) => ({
	telegram_id: c.telegram_id ?? undefined,
	full_name: c.full_name ?? '',
	is_active: c.is_active ?? true,
	date_of_birthday: c.date_of_birthday ?? '',
	gender: c.gender ?? '',
	phone_number: c.phone_number ?? '',
	region: c.region ?? 0,
	district: c.district ?? 0,
	filial: c.filial ?? 0,
	total_debt: Number(c.total_debt ?? 0),
	keshbek: Number(c.keshbek ?? 0),
	type: c.type === 'dona' || c.type === 'optom' || c.type === 'dokon' || c.type === 'hamkor' ? c.type : 'dona',
	is_delete: c.is_delete ?? false,
});
