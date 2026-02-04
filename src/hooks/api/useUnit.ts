/**
 * Unit Hooks
 * O'lchov birliklari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { unitService, type Unit, type UnitQueryParams } from '@/services/unit.service';

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
export const unitKeys = {
	all: ['units'] as const,
	lists: () => [...unitKeys.all, 'list'] as const,
	list: (params?: UnitQueryParams) => [...unitKeys.lists(), params] as const,
	details: () => [...unitKeys.all, 'detail'] as const,
	detail: (id: number) => [...unitKeys.details(), id] as const,
};

// Hooks
export const useUnits = (params?: UnitQueryParams) => {
	return useQuery({
		queryKey: unitKeys.list(params),
		queryFn: () => unitService.getUnits(params),
	});
};

export const useUnit = (id: number) => {
	return useQuery({
		queryKey: unitKeys.detail(id),
		queryFn: () => unitService.getUnitById(id),
		enabled: !!id,
	});
};

export const useCreateUnit = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<Unit>) => unitService.createUnit(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
			toast.success("O'lchov birligi muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast.error('Xatolik yuz berdi', {
				description: errorMessage,
			});
		},
	});
};

export const useUpdateUnit = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<Unit> }) => unitService.updateUnit(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
			queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.id) });
			toast.success("O'lchov birligi muvaffaqiyatli yangilandi");
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast.error('Xatolik yuz berdi', {
				description: errorMessage,
			});
		},
	});
};

export const useDeleteUnit = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => unitService.deleteUnit(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
			toast.success("O'lchov birligi muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			const errorMessage = formatErrorMessage(error);
			toast.error('Xatolik yuz berdi', {
				description: errorMessage,
			});
		},
	});
};
