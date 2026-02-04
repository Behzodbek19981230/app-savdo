/**
 * Sklad (Warehouse) Hooks
 * Omborlar uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	skladService,
	type Sklad,
	type SkladQueryParams,
	type CreateSkladPayload,
	type UpdateSkladPayload,
} from '@/services/sklad.service';

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

export const skladKeys = {
	all: ['sklad'] as const,
	lists: () => [...skladKeys.all, 'list'] as const,
	list: (params?: SkladQueryParams) => [...skladKeys.lists(), params] as const,
	details: () => [...skladKeys.all, 'detail'] as const,
	detail: (id: number) => [...skladKeys.details(), id] as const,
};

export const useSklads = (params?: SkladQueryParams) => {
	return useQuery({
		queryKey: skladKeys.list(params),
		queryFn: () => skladService.getSklads(params),
	});
};

export const useSklad = (id: number) => {
	return useQuery({
		queryKey: skladKeys.detail(id),
		queryFn: () => skladService.getSkladById(id),
		enabled: !!id,
	});
};

export const useCreateSklad = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateSkladPayload) => skladService.createSklad(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skladKeys.lists() });
			toast.success("Ombor muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdateSklad = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateSkladPayload }) => skladService.updateSklad(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: skladKeys.lists() });
			queryClient.invalidateQueries({ queryKey: skladKeys.detail(id) });
			toast.success('Ombor muvaffaqiyatli yangilandi');
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeleteSklad = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => skladService.deleteSklad(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skladKeys.lists() });
			toast.success("Ombor muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};
