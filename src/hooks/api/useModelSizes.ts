/**
 * Model Size Hooks
 * Mahsulot model o'lchamlari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  modelSizeService,
  type ModelSize,
  type ModelSizeQueryParams,
} from '@/services/modelSize.service';

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
export const modelSizeKeys = {
  all: ['modelSizes'] as const,
  lists: () => [...modelSizeKeys.all, 'list'] as const,
  list: (params?: ModelSizeQueryParams) => [...modelSizeKeys.lists(), params] as const,
  details: () => [...modelSizeKeys.all, 'detail'] as const,
  detail: (id: number) => [...modelSizeKeys.details(), id] as const,
};

// Hooks
export const useModelSizes = (params?: ModelSizeQueryParams) => {
  return useQuery({
    queryKey: modelSizeKeys.list(params),
    queryFn: () => modelSizeService.getModelSizes(params),
  });
};

export const useModelSize = (id: number) => {
  return useQuery({
    queryKey: modelSizeKeys.detail(id),
    queryFn: () => modelSizeService.getModelSizeById(id),
    enabled: !!id,
  });
};

export const useCreateModelSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ModelSize>) => modelSizeService.createModelSize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelSizeKeys.lists() });
      toast.success('Model o\'lchami muvaffaqiyatli qo\'shildi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};

export const useUpdateModelSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ModelSize> }) =>
      modelSizeService.updateModelSize(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: modelSizeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: modelSizeKeys.detail(id) });
      toast.success('Model o\'lchami muvaffaqiyatli tahrirlandi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};

export const useDeleteModelSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => modelSizeService.deleteModelSize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelSizeKeys.lists() });
      toast.success('Model o\'lchami muvaffaqiyatli o\'chirildi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};
