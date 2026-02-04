/**
 * ProductHistory Hooks
 * Mahsulot tarixi uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	productHistoryService,
	type ProductHistory,
	type ProductHistoryQueryParams,
	type CreateProductHistoryPayload,
	type UpdateProductHistoryPayload,
} from '@/services/productHistory.service';

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

export const productHistoryKeys = {
	all: ['product-history'] as const,
	lists: () => [...productHistoryKeys.all, 'list'] as const,
	list: (params?: ProductHistoryQueryParams) => [...productHistoryKeys.lists(), params] as const,
	details: () => [...productHistoryKeys.all, 'detail'] as const,
	detail: (id: number) => [...productHistoryKeys.details(), id] as const,
};

export const useProductHistories = (params?: ProductHistoryQueryParams) => {
	return useQuery({
		queryKey: productHistoryKeys.list(params),
		queryFn: () => productHistoryService.getProductHistories(params),
	});
};

export const useProductHistory = (id: number) => {
	return useQuery({
		queryKey: productHistoryKeys.detail(id),
		queryFn: () => productHistoryService.getProductHistoryById(id),
		enabled: !!id,
	});
};

export const useCreateProductHistory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateProductHistoryPayload) => productHistoryService.createProductHistory(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: productHistoryKeys.lists() });
			toast.success("Mahsulot muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdateProductHistory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateProductHistoryPayload }) =>
			productHistoryService.updateProductHistory(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: productHistoryKeys.lists() });
			queryClient.invalidateQueries({ queryKey: productHistoryKeys.detail(id) });
			toast.success('Mahsulot muvaffaqiyatli yangilandi');
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeleteProductHistory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => productHistoryService.deleteProductHistory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: productHistoryKeys.lists() });
			toast.success("Mahsulot muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};
