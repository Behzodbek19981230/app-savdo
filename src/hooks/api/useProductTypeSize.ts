/**
 * Product Type Size Hooks
 * Mahsulot turi o'lchamlari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	productTypeSizeService,
	type ProductTypeSize,
	type ProductTypeSizeQueryParams,
} from '@/services/productTypeSize.service';

// Helper function to format error messages
const formatErrorMessage = (error: unknown): string => {
	if (error && typeof error === 'object' && 'message' in error) {
		const errorObj = error as { message: unknown };

		if (errorObj.message && typeof errorObj.message === 'object') {
			const messages: string[] = [];

			Object.entries(errorObj.message).forEach(([field, value]) => {
				if (Array.isArray(value)) {
					value.forEach((msg) => {
						messages.push(`${field}: ${msg}`);
					});
				} else if (typeof value === 'string') {
					messages.push(`${field}: ${value}`);
				}
			});

			if (messages.length > 0) {
				return messages.join('\n');
			}
		}

		if ('errorMessage' in error && typeof (error as { errorMessage: unknown }).errorMessage === 'string') {
			return (error as { errorMessage: string }).errorMessage;
		}

		if (typeof errorObj.message === 'string') {
			return errorObj.message;
		}
	}

	return "Noma'lum xatolik yuz berdi";
};

// Query keys
export const productTypeSizeKeys = {
	all: ['productTypeSizes'] as const,
	lists: () => [...productTypeSizeKeys.all, 'list'] as const,
	list: (params?: ProductTypeSizeQueryParams) => [...productTypeSizeKeys.lists(), params] as const,
	details: () => [...productTypeSizeKeys.all, 'detail'] as const,
	detail: (id: number) => [...productTypeSizeKeys.details(), id] as const,
};

// Hooks
export const useProductTypeSizes = (params?: ProductTypeSizeQueryParams) => {
	return useQuery({
		queryKey: productTypeSizeKeys.list(params),
		queryFn: () => productTypeSizeService.getProductTypeSizes(params),
		enabled: params === undefined || params.product_type !== undefined,
	});
};

export const useProductTypeSize = (id: number) => {
	return useQuery({
		queryKey: productTypeSizeKeys.detail(id),
		queryFn: () => productTypeSizeService.getProductTypeSizeById(id),
		enabled: !!id,
	});
};

export const useCreateProductTypeSize = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<ProductTypeSize>) => productTypeSizeService.createProductTypeSize(data),
		onSuccess: async (createdSize, variables) => {
			// Mos product_type bo'yicha listni yangilash
			const productType = variables.product_type || createdSize.product_type;
			if (productType) {
				await queryClient.invalidateQueries({
					queryKey: productTypeSizeKeys.list({ product_type: productType, is_delete: false, limit: 1000 }),
				});
			}
			await queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
			toast.success("O'lcham muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast.error('Xatolik yuz berdi', {
				description: errorMessage,
			});
		},
	});
};

export const useUpdateProductTypeSize = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<ProductTypeSize> }) =>
			productTypeSizeService.updateProductTypeSize(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
			queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.detail(variables.id) });
			toast.success("O'lcham muvaffaqiyatli yangilandi");
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast.error('Xatolik yuz berdi', {
				description: errorMessage,
			});
		},
	});
};

export const useDeleteProductTypeSize = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => productTypeSizeService.deleteProductTypeSize(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: productTypeSizeKeys.lists() });
			toast.success("O'lcham muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast.error('Xatolik yuz berdi', {
				description: errorMessage,
			});
		},
	});
};
