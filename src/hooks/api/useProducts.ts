/**
 * Product Hooks
 * Mahsulotlar uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  productService,
  type Product,
  type ProductQueryParams,
} from '@/services/product.service';

// Helper function to format error messages
const formatErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as { message: unknown };
    
    // Handle complex nested error structures
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
    
    // Handle errorMessage field
    if ('errorMessage' in error && typeof (error as { errorMessage: unknown }).errorMessage === 'string') {
      return (error as { errorMessage: string }).errorMessage;
    }
    
    // Handle simple string message
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }
  
  return 'Noma\'lum xatolik yuz berdi';
};

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductQueryParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Hooks
export const useProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getProducts(params),
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Product>) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Mahsulot muvaffaqiyatli qo\'shildi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      productService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      toast.success('Mahsulot muvaffaqiyatli tahrirlandi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Mahsulot muvaffaqiyatli o\'chirildi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};
