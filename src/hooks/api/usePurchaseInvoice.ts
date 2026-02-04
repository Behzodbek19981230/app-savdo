/**
 * PurchaseInvoice Hooks
 * Faktura uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	purchaseInvoiceService,
	type PurchaseInvoice,
	type PurchaseInvoiceQueryParams,
	type CreatePurchaseInvoicePayload,
	type UpdatePurchaseInvoicePayload,
} from '@/services/purchaseInvoice.service';

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

export const purchaseInvoiceKeys = {
	all: ['purchase-invoice'] as const,
	lists: () => [...purchaseInvoiceKeys.all, 'list'] as const,
	list: (params?: PurchaseInvoiceQueryParams) => [...purchaseInvoiceKeys.lists(), params] as const,
	details: () => [...purchaseInvoiceKeys.all, 'detail'] as const,
	detail: (id: number) => [...purchaseInvoiceKeys.details(), id] as const,
};

export const usePurchaseInvoices = (params?: PurchaseInvoiceQueryParams) => {
	return useQuery({
		queryKey: purchaseInvoiceKeys.list(params),
		queryFn: () => purchaseInvoiceService.getPurchaseInvoices(params),
	});
};

export const usePurchaseInvoice = (id: number) => {
	return useQuery({
		queryKey: purchaseInvoiceKeys.detail(id),
		queryFn: () => purchaseInvoiceService.getPurchaseInvoiceById(id),
		enabled: !!id,
	});
};

export const useCreatePurchaseInvoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreatePurchaseInvoicePayload) => purchaseInvoiceService.createPurchaseInvoice(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.lists() });
			toast.success("Faktura muvaffaqiyatli qo'shildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useUpdatePurchaseInvoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdatePurchaseInvoicePayload }) =>
			purchaseInvoiceService.updatePurchaseInvoice(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.lists() });
			queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.detail(id) });
			toast.success('Faktura muvaffaqiyatli yangilandi');
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};

export const useDeletePurchaseInvoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => purchaseInvoiceService.deletePurchaseInvoice(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.lists() });
			toast.success("Faktura muvaffaqiyatli o'chirildi");
		},
		onError: (error: unknown) => {
			toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
		},
	});
};
