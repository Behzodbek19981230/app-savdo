/**
 * Model Type Hooks
 * Mahsulot model turlari uchun React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  modelTypeService,
  type ModelType,
  type ModelTypeQueryParams,
} from '@/services/modelType.service';

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
export const modelTypeKeys = {
  all: ['modelTypes'] as const,
  lists: () => [...modelTypeKeys.all, 'list'] as const,
  list: (params?: ModelTypeQueryParams) => [...modelTypeKeys.lists(), params] as const,
  details: () => [...modelTypeKeys.all, 'detail'] as const,
  detail: (id: number) => [...modelTypeKeys.details(), id] as const,
};

// Hooks
export const useModelTypes = (params?: ModelTypeQueryParams) => {
  return useQuery({
    queryKey: modelTypeKeys.list(params),
    queryFn: () => modelTypeService.getModelTypes(params),
  });
};

export const useModelType = (id: number) => {
  return useQuery({
    queryKey: modelTypeKeys.detail(id),
    queryFn: () => modelTypeService.getModelTypeById(id),
    enabled: !!id,
  });
};

export const useCreateModelType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ModelType>) => modelTypeService.createModelType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
      toast.success('Model turi muvaffaqiyatli qo\'shildi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};

export const useUpdateModelType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ModelType> }) =>
      modelTypeService.updateModelType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: modelTypeKeys.detail(id) });
      toast.success('Model turi muvaffaqiyatli tahrirlandi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};

export const useDeleteModelType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => modelTypeService.deleteModelType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelTypeKeys.lists() });
      toast.success('Model turi muvaffaqiyatli o\'chirildi');
    },
    onError: (error: unknown) => {
      const errorMessage = formatErrorMessage(error);
      toast.error('Xatolik yuz berdi', {
        description: errorMessage,
      });
    },
  });
};
