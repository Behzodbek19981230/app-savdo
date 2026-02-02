/**
 * Role Hooks
 * Rollar uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roleService, type Role, type RoleQueryParams } from '@/services/role.service';

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

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params?: RoleQueryParams) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
};

export const useRoles = (params?: RoleQueryParams) => {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => roleService.getRoles(params),
  });
};

export const useRole = (id: number) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleService.getRoleById(id),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Pick<Role, 'name' | 'description'>) => roleService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Role muvaffaqiyatli qo'shildi");
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<Role, 'name' | 'description'>> }) =>
      roleService.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success('Role muvaffaqiyatli tahrirlandi');
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Role muvaffaqiyatli o'chirildi");
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};
