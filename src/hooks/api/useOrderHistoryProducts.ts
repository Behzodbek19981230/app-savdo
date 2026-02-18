import { useQuery } from '@tanstack/react-query';
import { orderHistoryProductService } from '@/services/orderHistoryProduct.service';

export const useOrderHistoryProducts = (orderHistoryId: number | string | undefined, enabled = true) => {
	return useQuery<any, Error>({
		queryKey: ['order-history-products-by-model', orderHistoryId],
		queryFn: async () => {
			const res = await orderHistoryProductService.byModel(orderHistoryId as number | string);
			return res;
		},
		enabled: !!orderHistoryId && enabled,
	});
};
