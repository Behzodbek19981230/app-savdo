import { useQuery } from '@tanstack/react-query';
import { orderHistoryProductService, OrderHistoryProductListResponse } from '@/services/orderHistoryProduct.service';

export const useOrderHistoryProducts = (orderHistoryId: number | string | undefined, enabled = true) => {
	return useQuery<OrderHistoryProductListResponse, Error>({
		queryKey: ['order-history-products', orderHistoryId],
		queryFn: async () => {
			// `orderHistoryProductService.list` already returns the response data (see api client),
			// so return it directly.
			const res = await orderHistoryProductService.list({ order_history: orderHistoryId });
			return res;
		},
		enabled: !!orderHistoryId && enabled,
	});
};
