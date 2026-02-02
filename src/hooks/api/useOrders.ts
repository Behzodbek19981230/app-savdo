/**
 * Order Hooks
 * React Query hooks for orders
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  orderService, 
  type OrderQueryParams,
  type CreateOrderData,
  type UpdateOrderData,
} from '@/services';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const ORDER_KEYS = {
  all: ['orders'] as const,
  list: (params?: OrderQueryParams) => ['orders', 'list', params] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  recent: (limit?: number) => ['orders', 'recent', limit] as const,
};

/**
 * Get all orders
 */
export function useOrders(params?: OrderQueryParams) {
  return useQuery({
    queryKey: ORDER_KEYS.list(params),
    queryFn: () => orderService.getAll(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get recent orders
 */
export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ORDER_KEYS.recent(limit),
    queryFn: () => orderService.getRecent(limit),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => orderService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create order mutation
 */
export function useCreateOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => orderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      
      toast({
        title: 'Buyurtma yaratildi',
        description: 'Yangi buyurtma muvaffaqiyatli yaratildi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Buyurtma yaratishda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update order mutation
 */
export function useUpdateOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderData }) => 
      orderService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) });
      
      toast({
        title: 'Buyurtma yangilandi',
        description: 'Buyurtma muvaffaqiyatli yangilandi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Buyurtma yangilashda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete order mutation
 */
export function useDeleteOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      
      toast({
        title: 'Buyurtma o\'chirildi',
        description: 'Buyurtma muvaffaqiyatli o\'chirildi.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Buyurtma o\'chirishda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}
