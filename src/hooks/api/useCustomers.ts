/**
 * Customer Hooks
 * React Query hooks for customers
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  customerService, 
  type Customer, 
  type CustomerQueryParams,
  type CreateCustomerData,
  type UpdateCustomerData,
} from '@/services';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const CUSTOMER_KEYS = {
  all: ['customers'] as const,
  list: (params?: CustomerQueryParams) => ['customers', 'list', params] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
  search: (query: string) => ['customers', 'search', query] as const,
};

/**
 * Get all customers
 */
export function useCustomers(params?: CustomerQueryParams) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: () => customerService.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get customer by ID
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Search customers
 */
export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.search(query),
    queryFn: () => customerService.search(query),
    enabled: query.length > 2,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Create customer mutation
 */
export function useCreateCustomer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerData) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      
      toast({
        title: 'Mijoz qo\'shildi',
        description: 'Yangi mijoz muvaffaqiyatli qo\'shildi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Mijoz qo\'shishda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update customer mutation
 */
export function useUpdateCustomer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerData }) => 
      customerService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(variables.id) });
      
      toast({
        title: 'Mijoz yangilandi',
        description: 'Mijoz ma\'lumotlari muvaffaqiyatli yangilandi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Mijoz yangilashda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete customer mutation
 */
export function useDeleteCustomer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
      
      toast({
        title: 'Mijoz o\'chirildi',
        description: 'Mijoz muvaffaqiyatli o\'chirildi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Mijoz o\'chirishda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}
