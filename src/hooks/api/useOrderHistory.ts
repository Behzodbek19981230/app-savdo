import { useQuery } from '@tanstack/react-query';
import { orderHistoryService } from '@/services/orderHistory.service';

export const ORDER_HISTORY_KEYS = {
	all: ['order-history'] as const,
	lists: () => [...ORDER_HISTORY_KEYS.all, 'list'] as const,
	list: (params?: Record<string, unknown>) => [...ORDER_HISTORY_KEYS.lists(), params] as const,
};

export function useOrderHistory(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: ORDER_HISTORY_KEYS.list(params),
		queryFn: () => orderHistoryService.getList(params),
	});
}
