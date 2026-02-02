/**
 * Product Model Hooks
 * Mahsulot modellari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productModelService, type ProductModelQueryParams, type ProductModel } from '@/services/productModel.service';
import { toast } from '@/hooks/use-toast';

// Helper function to format error messages
const formatErrorMessage = (error: unknown): string => {
  const err = error as Record<string, unknown>;
  
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
  
  if (err.errorMessage && typeof err.errorMessage === 'string') {
    return err.errorMessage;
  }
  
  if (typeof err.message === 'string') {
    return err.message;
  }
  
  return 'Xatolik yuz berdi';
};

// Query Keys
export const PRODUCT_MODEL_KEYS = {
  all: ['productModels'] as const,
  lists: () => [...PRODUCT_MODEL_KEYS.all, 'list'] as const,
  list: (params?: ProductModelQueryParams) => [...PRODUCT_MODEL_KEYS.lists(), params] as const,
  details: () => [...PRODUCT_MODEL_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCT_MODEL_KEYS.details(), id] as const,
};

/**
 * Mahsulot modellarini olish
 */
export function useProductModels(params?: ProductModelQueryParams) {
  return useQuery({
    queryKey: PRODUCT_MODEL_KEYS.list(params),
    queryFn: () => productModelService.getModels(params),
  });
}

/**
 * Bitta mahsulot modelini olish
 */
export function useProductModel(id: number) {
  return useQuery({
    queryKey: PRODUCT_MODEL_KEYS.detail(id),
    queryFn: () => productModelService.getModelById(id),
    enabled: !!id,
  });
}

/**
 * Mahsulot modeli yaratish
 */
export function useCreateProductModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ProductModel>) => productModelService.createModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot modeli qo\'shildi',
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
 * Mahsulot modelini yangilash
 */
export function useUpdateProductModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductModel> }) => 
      productModelService.updateModel(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.detail(variables.id) });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot modeli yangilandi',
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
 * Mahsulot modelini o'chirish
 */
export function useDeleteProductModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => productModelService.deleteModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_MODEL_KEYS.lists() });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot modeli o\'chirildi',
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
