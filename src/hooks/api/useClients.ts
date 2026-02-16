import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/client.service';

export const CLIENTS_KEYS = {
	all: ['clients'] as const,
	lists: () => [...CLIENTS_KEYS.all, 'list'] as const,
	list: (params?: Record<string, unknown>) => [...CLIENTS_KEYS.lists(), params] as const,
};

export function useClients(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: CLIENTS_KEYS.list(params),
		queryFn: () => clientService.list(params),
		keepPreviousData: true,
	});
}
