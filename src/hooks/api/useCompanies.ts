/**
 * Company Hooks
 * /company uchun React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  companyService,
  type Company,
  type CompanyQueryParams,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from '@/services/company.service';

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

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (params?: CompanyQueryParams) => [...companyKeys.lists(), params] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
};

export const useCompanies = (params?: CompanyQueryParams) => {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => companyService.getCompanies(params),
  });
};

export const useCompany = (id: number) => {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companyService.getCompanyById(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyPayload) => companyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success("Company muvaffaqiyatli qo'shildi");
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompanyPayload }) => companyService.updateCompany(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) });
      toast.success('Company muvaffaqiyatli tahrirlandi');
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success("Company muvaffaqiyatli o'chirildi");
    },
    onError: (error: unknown) => {
      toast.error('Xatolik yuz berdi', { description: formatErrorMessage(error) });
    },
  });
};

export const toCompanyFormDefaults = (c: Company) => ({
  name: c.name ?? '',
  email: c.email ?? '',
  phone: c.phone ?? '',
  address: c.address ?? '',
  title: c.title ?? '',
  description: c.description ?? '',
});
