import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debtRepaymentService } from '@/services/debtRepayment.service';
import { useToast } from '@/hooks/use-toast';

export const useDeleteDebtKorzinka = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number | string) => debtRepaymentService.deleteKorzinka(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['debt-repayment-korzinka'], exact: false });
			toast({
				title: "Korzinka qarz o'chirildi",
				description: "Korzinka qarz muvaffaqiyatli o'chirildi.",
			});
		},
		onError: (error: any) => {
			toast({
				title: 'Xatolik yuz berdi',
				description: error?.message || "Korzinka qarz o'chirishda xatolik.",
				variant: 'destructive',
			});
		},
	});
};
