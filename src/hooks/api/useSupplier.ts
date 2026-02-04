/**
 * Supplier Hooks
 * Ta'minotchilar uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	supplierService,
	type Supplier,
	type SupplierQueryParams,
	type CreateSupplierPayload,
	type UpdateSupplierPayload,
} from '@/services/supplier.service';

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

export const supplierKeys = {
	all: ['supplier'] as const,
	lists: () => [...supplierKeys.all, 'list'] as const,
	list: (params?: SupplierQueryParams) => [...supplierKeys.lists(), params] as const,
	details: () => [...supplierKeys.all, 'detail'] as const,
	detail: (id: number) => [...supplierKeys.details(), id] as const,
};

export const useSuppliers = (params?: SupplierQueryParams) => {
	return useQuery({
		queryKey: supplierKeys.list(params),
		queryFn: () => supplierService.getSuppliers(params),
	});
};

export const useSupplier = (id: number) => {
	return useQuery({
		queryKey: supplierKeys.detail(id),
		queryFn: () => supplierService.getSupplierById(id),
		enabled: !!id,
	});
};

export const useCreateSupplier = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateSupplierPayload) => supplierService.createSupplier(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
			toast.success("Ta'minotchi muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdateSupplier = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateSupplierPayload }) =>
			supplierService.updateSupplier(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
			queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
			toast.success("Ta'minotchi muvaffaqiyatli yangilandi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeleteSupplier = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => supplierService.deleteSupplier(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
			toast.success("Ta'minotchi muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};
