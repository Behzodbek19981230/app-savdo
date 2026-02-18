import { useQuery } from '@tanstack/react-query';
import { orderHistoryService } from '@/services/orderHistory.service';

export const useKorzinka = (params?: Record<string, unknown>, enabled = true) => {
	return useQuery<any, Error>({
		queryKey: ['korzinka', params],
		queryFn: async () => {
			const res = await orderHistoryService.korzinka(params);
			return res;
		},
		enabled: enabled,
	});
};
