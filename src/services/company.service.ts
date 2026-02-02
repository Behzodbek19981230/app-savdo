/**
 * Company Service
 * /company endpoint bilan ishlash
 *
 * NOTE: logo binary file bo'lgani uchun create/update FormData orqali yuboriladi.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

export interface Company {
    id: number;
    name: string;
    // backend odatda logo URL qaytaradi (string)
    logo: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    title: string | null;
    description: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface CompanyListResponse {
    pagination: PaginationMeta;
    results: Company[];
    filters: unknown;
}

export interface CompanyQueryParams {
    page?: number;
    perPage?: number;
    search?: string;
    ordering?: string;
    is_delete?: boolean;
}

export type CreateCompanyPayload = {
    name: string;
    logo: File;
    email?: string;
    phone?: string;
    address?: string;
    title?: string;
    description?: string;
};

export type UpdateCompanyPayload = Partial<Omit<CreateCompanyPayload, 'logo'>> & {
    logo?: File;
};

const appendIfDefined = (form: FormData, key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    form.append(key, String(value));
};

export const companyService = {
    getCompanies: async (params?: CompanyQueryParams) => {
        return api.get<CompanyListResponse>(API_ENDPOINTS.companies.list, { params });
    },

    getCompanyById: async (id: number) => {
        return api.get<Company>(API_ENDPOINTS.companies.byId(id.toString()));
    },

    createCompany: async (data: CreateCompanyPayload) => {
        const form = new FormData();
        form.append('name', data.name);
        form.append('logo', data.logo);
        appendIfDefined(form, 'email', data.email ?? '');
        appendIfDefined(form, 'phone', data.phone ?? '');
        appendIfDefined(form, 'address', data.address ?? '');
        appendIfDefined(form, 'title', data.title ?? '');
        appendIfDefined(form, 'description', data.description ?? '');
        return api.post<Company>(API_ENDPOINTS.companies.create, form);
    },

    updateCompany: async (id: number, data: UpdateCompanyPayload) => {
        const form = new FormData();
        appendIfDefined(form, 'name', data.name);
        if (data.logo) form.append('logo', data.logo);
        appendIfDefined(form, 'email', data.email);
        appendIfDefined(form, 'phone', data.phone);
        appendIfDefined(form, 'address', data.address);
        appendIfDefined(form, 'title', data.title);
        appendIfDefined(form, 'description', data.description);

        return api.put<Company>(API_ENDPOINTS.companies.update(id.toString()), form);
    },

    deleteCompany: async (id: number) => {
        return api.delete(API_ENDPOINTS.companies.delete(id.toString()));
    },
};
