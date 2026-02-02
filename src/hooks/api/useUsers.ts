/**
 * Users Hooks
 * Admin userlar uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  userService,
  type AppUser,
  type AppUserQueryParams,
  type CreateAppUserPayload,
  type UpdateAppUserPayload,
} from '@/services/user.service';

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

export const userKeys = {
  all: ['users-admin'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: AppUserQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

export const useUsers = (params?: AppUserQueryParams) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getUsers(params),
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppUserPayload) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Foydalanuvchi muvaffaqiyatli qo'shildi");
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAppUserPayload }) => userService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success('Foydalanuvchi muvaffaqiyatli tahrirlandi');
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Foydalanuvchi muvaffaqiyatli o'chirildi");
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

// UI helper
export const toUserFormDefaults = (u: AppUser) => ({
  username: u.username ?? '',
  full_name: u.full_name ?? '',
  is_active: !!u.is_active,
  date_of_birthday: u.date_of_birthday ?? '',
  gender: u.gender ?? '',
  phone_number: u.phone_number ?? '',
  email: u.email ?? '',
  password: '',
  company: u.company ?? 0,
  region: u.region ?? 0,
  district: u.district ?? 0,
  roles: Array.isArray(u.roles) ? u.roles : [],
  address: u.address ?? '',
  // avatar file sifatida alohida tanlanadi, bu yerda faqat placeholder
  avatar: undefined,
});
