import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderHistoryService } from '@/services/orderHistory.service';
import { useToast } from '@/hooks/use-toast';

export const useDeleteOrderHistory = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number | string) => orderHistoryService.delete(id),
		onSuccess: () => {
			// invalidate korzinka queries (prefix match)
			queryClient.invalidateQueries({ queryKey: ['korzinka'], exact: false });

			toast({
				title: "Buyurtma o'chirildi",
				description: "Korzinka buyurtma muvaffaqiyatli o'chirildi.",
			});
		},
		onError: (error: any) => {
			toast({
				title: 'Xatolik yuz berdi',
				description: error?.message || "Buyurtma o'chirishda xatolik.",
				variant: 'destructive',
			});
		},
	});
};

export const useDeleteKorzinkaOrderHistory = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number | string) => orderHistoryService.deleteKorzinka(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['korzinka'], exact: false });
			toast({
				title: "Korzinka buyurtma o'chirildi",
				description: "Korzinka buyurtma muvaffaqiyatli o'chirildi.",
			});
		},
		onError: (error: any) => {
			toast({
				title: 'Xatolik yuz berdi',
				description: error?.message || "Korzinka buyurtma o'chirishda xatolik.",
				variant: 'destructive',
			});
		},
	});
};
