/**
 * Expense Category Hooks
 * Xarajat kategoriyalari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	expenseCategoryService,
	type ExpenseCategoryQueryParams,
	type ExpenseCategory,
	ExpenseCategoryListResponse,
} from '@/services/expenseCategory.service';
import { toast } from '@/hooks/use-toast';

// Helper function to format error messages
const formatErrorMessage = (error: unknown): string => {
	const err = error as Record<string, unknown>;

	// Check if error has message object with field errors
	if (err.message && typeof err.message === 'object') {
		const fieldErrors: string[] = [];

		Object.entries(err.message).forEach(([, messages]) => {
			if (Array.isArray(messages)) {
				messages.forEach((msg) => {
					fieldErrors.push(String(msg));
				});
			} else if (typeof messages === 'string') {
				fieldErrors.push(messages);
			}
		});

		if (fieldErrors.length > 0) {
			return fieldErrors.join('\n');
		}
	}

	// Check if error has errorMessage
	if (err.errorMessage && typeof err.errorMessage === 'string') {
		return err.errorMessage;
	}

	// Check if error has message string
	if (typeof err.message === 'string') {
		return err.message;
	}

	return 'Xatolik yuz berdi';
};

// Query Keys
export const EXPENSE_CATEGORY_KEYS = {
	all: ['expenseCategories'] as const,
	lists: () => [...EXPENSE_CATEGORY_KEYS.all, 'list'] as const,
	list: (params?: ExpenseCategoryQueryParams) => [...EXPENSE_CATEGORY_KEYS.lists(), params] as const,
	details: () => [...EXPENSE_CATEGORY_KEYS.all, 'detail'] as const,
	detail: (id: string) => [...EXPENSE_CATEGORY_KEYS.details(), id] as const,
};

/**
 * Xarajat kategoriyalarini olish
 */
export function useExpenseCategories(params?: ExpenseCategoryQueryParams) {
	return useQuery<ExpenseCategoryListResponse>({
		queryKey: EXPENSE_CATEGORY_KEYS.list(params),
		queryFn: () => expenseCategoryService.getCategories(params),
	});
}

/**
 * Bitta xarajat kategoriyasini olish
 */
export function useExpenseCategory(id: string) {
	return useQuery({
		queryKey: EXPENSE_CATEGORY_KEYS.detail(id),
		queryFn: () => expenseCategoryService.getCategoryById(id),
		enabled: !!id,
	});
}

/**
 * Xarajat kategoriyasi yaratish
 */
export function useCreateExpenseCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<ExpenseCategory>) => expenseCategoryService.createCategory(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORY_KEYS.lists() });
			toast({
				title: 'Muvaffaqiyatli!',
				description: "Xarajat kategoriyasi qo'shildi",
			});
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast({
				title: 'Xatolik!',
				description: errorMessage,
				variant: 'destructive',
			});
		},
	});
}

/**
 * Xarajat kategoriyasini yangilash
 */
export function useUpdateExpenseCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<ExpenseCategory> }) =>
			expenseCategoryService.updateCategory(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORY_KEYS.lists() });
			queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORY_KEYS.detail(variables.id.toString()) });
			toast({
				title: 'Muvaffaqiyatli!',
				description: 'Xarajat kategoriyasi yangilandi',
			});
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast({
				title: 'Xatolik!',
				description: errorMessage,
				variant: 'destructive',
			});
		},
	});
}

/**
 * Xarajat kategoriyasini o'chirish
 */
export function useDeleteExpenseCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => expenseCategoryService.deleteCategory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORY_KEYS.lists() });
			toast({
				title: 'Muvaffaqiyatli!',
				description: "Xarajat kategoriyasi o'chirildi",
			});
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast({
				title: 'Xatolik!',
				description: errorMessage,
				variant: 'destructive',
			});
		},
	});
}
