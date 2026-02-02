/**
 * Product Images Hooks
 * Mahsulot rasmlari uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productImageService, type ProductImageQueryParams, type ProductImage } from '@/services/productImage.service';

// Helper function to format error messages (same style as other hooks)
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

			if (messages.length > 0) return messages.join('\n');
		}

		if ('errorMessage' in error && typeof (error as { errorMessage: unknown }).errorMessage === 'string') {
			return (error as { errorMessage: string }).errorMessage;
		}

		if (typeof errorObj.message === 'string') return errorObj.message;
	}

	return "Noma'lum xatolik yuz berdi";
};

export const productImageKeys = {
	all: ['product-images'] as const,
	lists: () => [...productImageKeys.all, 'list'] as const,
	list: (params?: ProductImageQueryParams) => [...productImageKeys.lists(), params] as const,
};

export const useProductImages = (params?: ProductImageQueryParams) => {
	return useQuery({
		queryKey: productImageKeys.list(params),
		queryFn: () => productImageService.getProductImages(params),
		enabled: !!params?.product,
	});
};

export const useCreateProductImage = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: { product: number; file: File }) => productImageService.createProductImage(payload),
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: productImageKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: productImageKeys.list({ product: payload.product }),
			});
			toast.success("Rasm muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdateProductImage = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: { id: number; product: number; file: File }) =>
			productImageService.updateProductImage(payload),
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: productImageKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: productImageKeys.list({ product: payload.product }),
			});
			toast.success('Rasm muvaffaqiyatli tahrirlandi');
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeleteProductImage = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: { id: number; product: number }) => productImageService.deleteProductImage(payload.id),
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: productImageKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: productImageKeys.list({ product: payload.product }),
			});
			toast.success("Rasm muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

// Useful helper for UI: normalize response to array
export const normalizeProductImages = (data: unknown): ProductImage[] => {
	if (!data) return [];
	if (Array.isArray(data)) return data as ProductImage[];
	if (typeof data === 'object' && data && 'results' in data) {
		const maybe = data as { results?: unknown };
		return Array.isArray(maybe.results) ? (maybe.results as ProductImage[]) : [];
	}
	return [];
};
