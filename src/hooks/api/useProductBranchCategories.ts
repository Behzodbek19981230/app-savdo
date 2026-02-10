/**
 * Product Branch Category Hooks
 * Mahsulot turlari kategoriyasi uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	productBranchCategoryService,
	type ProductBranchCategoryQueryParams,
	type ProductBranchCategory,
	ProductBranchCategoryListResponse,
} from '@/services/productBranchCategory.service';
import { toast } from '@/hooks/use-toast';

const formatErrorMessage = (error: unknown): string => {
	const err = error as Record<string, unknown>;
	if (err.message && typeof err.message === 'object') {
		const fieldErrors: string[] = [];
		Object.entries(err.message).forEach(([, messages]) => {
			if (Array.isArray(messages)) {
				messages.forEach((msg) => fieldErrors.push(String(msg)));
			} else if (typeof messages === 'string') {
				fieldErrors.push(messages);
			}
		});
		if (fieldErrors.length > 0) return fieldErrors.join('\n');
	}
	if (err.errorMessage && typeof err.errorMessage === 'string') return err.errorMessage;
	if (typeof err.message === 'string') return err.message;
	return 'Xatolik yuz berdi';
};

export const PRODUCT_BRANCH_CATEGORY_KEYS = {
	all: ['productBranchCategories'] as const,
	lists: () => [...PRODUCT_BRANCH_CATEGORY_KEYS.all, 'list'] as const,
	list: (params?: ProductBranchCategoryQueryParams) =>
		[...PRODUCT_BRANCH_CATEGORY_KEYS.lists(), params] as const,
	details: () => [...PRODUCT_BRANCH_CATEGORY_KEYS.all, 'detail'] as const,
	detail: (id: string) => [...PRODUCT_BRANCH_CATEGORY_KEYS.details(), id] as const,
};

export function useProductBranchCategories(params?: ProductBranchCategoryQueryParams) {
	return useQuery<ProductBranchCategoryListResponse>({
		queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.list(params),
		queryFn: () => productBranchCategoryService.getCategories(params),
	});
}

export function useProductBranchCategory(id: string) {
	return useQuery({
		queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.detail(id),
		queryFn: () => productBranchCategoryService.getCategoryById(id),
		enabled: !!id,
	});
}

export function useCreateProductBranchCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<ProductBranchCategory>) =>
			productBranchCategoryService.createCategory(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
			toast({ title: 'Muvaffaqiyatli!', description: "Kategoriya qo'shildi" });
		},
		onError: (error: unknown) => {
			toast({
				title: 'Xatolik!',
				description: formatErrorMessage(error),
				variant: 'destructive',
			});
		},
	});
}

export function useUpdateProductBranchCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<ProductBranchCategory> }) =>
			productBranchCategoryService.updateCategory(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
			queryClient.invalidateQueries({
				queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.detail(variables.id.toString()),
			});
			toast({ title: 'Muvaffaqiyatli!', description: 'Kategoriya yangilandi' });
		},
		onError: (error: unknown) => {
			toast({
				title: 'Xatolik!',
				description: formatErrorMessage(error),
				variant: 'destructive',
			});
		},
	});
}

export function useDeleteProductBranchCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => productBranchCategoryService.deleteCategory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PRODUCT_BRANCH_CATEGORY_KEYS.lists() });
			toast({ title: 'Muvaffaqiyatli!', description: "Kategoriya o'chirildi" });
		},
		onError: (error: unknown) => {
			toast({
				title: 'Xatolik!',
				description: formatErrorMessage(error),
				variant: 'destructive',
			});
		},
	});
}
