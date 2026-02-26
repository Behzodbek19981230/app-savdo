import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAccountService, type CreateSupplierAccountPayload, type UpdateSupplierAccountPayload, type CreateSupplierDebtRepaymentPayload, type UpdateSupplierDebtRepaymentPayload } from '@/services/supplierAccount.service';

export const SUPPLIER_ACCOUNT_KEYS = {
    all: ['supplier-account'] as const,
    lists: () => [...SUPPLIER_ACCOUNT_KEYS.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...SUPPLIER_ACCOUNT_KEYS.lists(), params] as const,
    detail: (id: number) => [...SUPPLIER_ACCOUNT_KEYS.all, 'detail', id] as const,
    debtRepayment: (params?: Record<string, unknown>) => [...SUPPLIER_ACCOUNT_KEYS.all, 'debt-repayment', params] as const,
    debtRepaymentDetail: (id: number) => [...SUPPLIER_ACCOUNT_KEYS.all, 'debt-repayment', 'detail', id] as const,
};

export function useSupplierAccount(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: SUPPLIER_ACCOUNT_KEYS.list(params),
        queryFn: () => supplierAccountService.getList(params),
    });
}

export function useSupplierAccountById(id: number | null) {
    return useQuery({
        queryKey: SUPPLIER_ACCOUNT_KEYS.detail(id!),
        queryFn: () => supplierAccountService.getById(id!),
        enabled: !!id,
    });
}

export function useCreateSupplierAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSupplierAccountPayload) => supplierAccountService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.lists() });
        },
    });
}

export function useUpdateSupplierAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateSupplierAccountPayload }) =>
            supplierAccountService.update(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.detail(variables.id) });
        },
    });
}

export function useDeleteSupplierAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => supplierAccountService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.lists() });
        },
    });
}

export function useSupplierDebtRepayment(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: SUPPLIER_ACCOUNT_KEYS.debtRepayment(params),
        queryFn: () => supplierAccountService.getDebtRepaymentList(params),
    });
}

export function useSupplierDebtRepaymentById(id: number | null) {
    return useQuery({
        queryKey: SUPPLIER_ACCOUNT_KEYS.debtRepaymentDetail(id!),
        queryFn: () => supplierAccountService.getDebtRepaymentById(id!),
        enabled: !!id,
    });
}

export function useCreateSupplierDebtRepayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSupplierDebtRepaymentPayload) => supplierAccountService.createDebtRepayment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.all });
        },
    });
}

export function useUpdateSupplierDebtRepayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateSupplierDebtRepaymentPayload }) =>
            supplierAccountService.updateDebtRepayment(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.debtRepaymentDetail(variables.id) });
        },
    });
}

export function useDeleteSupplierDebtRepayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => supplierAccountService.deleteDebtRepayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SUPPLIER_ACCOUNT_KEYS.all });
        },
    });
}
