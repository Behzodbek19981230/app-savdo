import { useQuery } from '@tanstack/react-query';
import { debtRepaymentService } from '@/services/debtRepayment.service';

export const useDebtKorzinka = (params?: Record<string, unknown>, enabled = true) => {
	return useQuery<any, Error>({
		queryKey: ['debt-repayment-korzinka', params],
		queryFn: async () => {
			const res = await debtRepaymentService.korzinka(params);
			return res;
		},
		enabled: enabled,
	});
};
