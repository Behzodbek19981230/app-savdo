/**
 * Product Category Hooks
 * Mahsulot turlari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productCategoryService, type ProductCategoryQueryParams, type ProductCategory, ProductCategoryListResponse } from '@/services/productCategory.service';
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
export const PRODUCT_CATEGORY_KEYS = {
  all: ['productCategories'] as const,
  lists: () => [...PRODUCT_CATEGORY_KEYS.all, 'list'] as const,
  list: (params?: ProductCategoryQueryParams) => [...PRODUCT_CATEGORY_KEYS.lists(), params] as const,
  details: () => [...PRODUCT_CATEGORY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_CATEGORY_KEYS.details(), id] as const,
};

/**
 * Mahsulot turlarini olish
 */
export function useProductCategories(params?: ProductCategoryQueryParams) {
  return useQuery<ProductCategoryListResponse>({
    queryKey: PRODUCT_CATEGORY_KEYS.list(params),
    queryFn: () => productCategoryService.getCategories(params),
  });
}

/**
 * Bitta mahsulot turini olish
 */
export function useProductCategory(id: string) {
  return useQuery({
    queryKey: PRODUCT_CATEGORY_KEYS.detail(id),
    queryFn: () => productCategoryService.getCategoryById(id),
    enabled: !!id,
  });
}

/**
 * Mahsulot turi yaratish
 */
export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ProductCategory>) => productCategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.lists() });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot turi qo\'shildi',
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
 * Mahsulot turini yangilash
 */
export function useUpdateProductCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductCategory> }) => 
      productCategoryService.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.detail(variables.id.toString()) });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot turi yangilandi',
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
 * Mahsulot turini o'chirish
 */
export function useDeleteProductCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => productCategoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_CATEGORY_KEYS.lists() });
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mahsulot turi o\'chirildi',
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
