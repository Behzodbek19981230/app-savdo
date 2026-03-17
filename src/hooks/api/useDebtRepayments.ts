/**
 * Debt Repayment Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtRepaymentService } from '@/services/debtRepayment.service';
import { toast } from '@/hooks/use-toast';

export const DEBT_REPAYMENT_KEYS = {
    all: ['debtRepayments'] as const,
    lists: () => [...DEBT_REPAYMENT_KEYS.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...DEBT_REPAYMENT_KEYS.lists(), params] as const,
    grouped: (params?: Record<string, unknown>) => [...DEBT_REPAYMENT_KEYS.all, 'grouped', params] as const,
    details: () => [...DEBT_REPAYMENT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...DEBT_REPAYMENT_KEYS.details(), id] as const,
};

export function useDebtRepaymentsGrouped(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: DEBT_REPAYMENT_KEYS.grouped(params),
        queryFn: () => debtRepaymentService.getGroupedByDate(params),
    });
}

export function useDebtRepayments(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: DEBT_REPAYMENT_KEYS.list(params),
        queryFn: () => debtRepaymentService.getList(params),
    });
}

export function useCreateDebtRepayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => debtRepaymentService.createDebtRepayment(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.lists() });
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.grouped() });
            toast({ title: 'Muvaffaqiyatli', description: "Qarz to'lovi yaratildi" });
        },
        onError: (err: unknown) => {
            toast({ title: 'Xatolik', description: 'Qarz to\'lovi yaratilamadi', variant: 'destructive' });
        },
    });
}

export function useUpdateDebtRepayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => debtRepaymentService.updateDebtRepayment(id, data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.lists() });
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.grouped() });
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.detail(variables.id.toString()) });
            toast({ title: 'Muvaffaqiyatli', description: "Qarz to'lovi yangilandi" });
        },
        onError: () => {
            toast({ title: 'Xatolik', description: "Qarz to'lovi yangilanmadi", variant: 'destructive' });
        },
    });
}

export function useDeleteDebtRepayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => debtRepaymentService.deleteDebtRepayment(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.lists() });
            qc.invalidateQueries({ queryKey: DEBT_REPAYMENT_KEYS.grouped() });
            toast({ title: 'Muvaffaqiyatli', description: "Qarz to'lovi o'chirildi" });
        },
        onError: () => {
            toast({ title: 'Xatolik', description: "Qarz to'lovi o'chirilmadi", variant: 'destructive' });
        },
    });
}
