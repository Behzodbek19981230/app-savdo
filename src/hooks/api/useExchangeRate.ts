/**
 * ExchangeRate Hooks
 * Dollar kursi uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	exchangeRateService,
	type ExchangeRate,
	type ExchangeRateQueryParams,
	type CreateExchangeRatePayload,
	type UpdateExchangeRatePayload,
} from '@/services/exchangeRate.service';

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

export const exchangeRateKeys = {
	all: ['exchange-rate'] as const,
	lists: () => [...exchangeRateKeys.all, 'list'] as const,
	list: (params?: ExchangeRateQueryParams) => [...exchangeRateKeys.lists(), params] as const,
	details: () => [...exchangeRateKeys.all, 'detail'] as const,
	detail: (id: number) => [...exchangeRateKeys.details(), id] as const,
};

export const useExchangeRates = (params?: ExchangeRateQueryParams) => {
	return useQuery({
		queryKey: exchangeRateKeys.list(params),
		queryFn: () => exchangeRateService.getExchangeRates(params),
	});
};

export const useExchangeRate = (id: number) => {
	return useQuery({
		queryKey: exchangeRateKeys.detail(id),
		queryFn: () => exchangeRateService.getExchangeRateById(id),
		enabled: !!id,
	});
};

export const useCreateExchangeRate = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateExchangeRatePayload) => exchangeRateService.createExchangeRate(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
			toast.success("Dollar kursi muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdateExchangeRate = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateExchangeRatePayload }) =>
			exchangeRateService.updateExchangeRate(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
			queryClient.invalidateQueries({ queryKey: exchangeRateKeys.detail(id) });
			toast.success('Dollar kursi muvaffaqiyatli yangilandi');
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeleteExchangeRate = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => exchangeRateService.deleteExchangeRate(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
			toast.success("Dollar kursi muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

// Filial bo'yicha dollar kursini olish yoki yaratish/yangilash uchun hook
export const useUpsertExchangeRate = () => {
	const queryClient = useQueryClient();
	const createMutation = useCreateExchangeRate();
	const updateMutation = useUpdateExchangeRate();

	return {
		upsert: async (existingRate: ExchangeRate | null, filialId: number, dollar: number) => {
			if (existingRate) {
				await updateMutation.mutateAsync({ id: existingRate.id, data: { dollar } });
			} else {
				await createMutation.mutateAsync({ filial: filialId, dollar });
			}
			queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
		},
		isPending: createMutation.isPending || updateMutation.isPending,
	};
};
