/**
 * Company Service
 * /company endpoint bilan ishlash
 *
 * NOTE: logo binary file bo'lgani uchun create/update FormData orqali yuboriladi.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';
import type { Company, CompanyQueryParams, CreateCompanyPayload, UpdateCompanyPayload } from '@/types/company';

export type { Company, CompanyQueryParams, CreateCompanyPayload, UpdateCompanyPayload };

export interface CompanyListResponse {
	pagination: PaginationMeta;
	results: Company[];
	filters: unknown;
}

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
		if (data.logo) form.append('logo', data.logo);
		appendIfDefined(form, 'region', data.region);
		appendIfDefined(form, 'district', data.district);
		appendIfDefined(form, 'address', data.address ?? '');
		appendIfDefined(form, 'phone_number', data.phone_number ?? '');
		appendIfDefined(form, 'is_active', data.is_active ?? true);
		appendIfDefined(form, 'is_delete', data.is_delete ?? false);
		return api.post<Company>(API_ENDPOINTS.companies.create, form);
	},

	updateCompany: async (id: number, data: UpdateCompanyPayload) => {
		const form = new FormData();
		appendIfDefined(form, 'name', data.name);
		if (data.logo) form.append('logo', data.logo);
		appendIfDefined(form, 'region', data.region);
		appendIfDefined(form, 'district', data.district);
		appendIfDefined(form, 'address', data.address);
		appendIfDefined(form, 'phone_number', data.phone_number);
		appendIfDefined(form, 'is_active', data.is_active);
		appendIfDefined(form, 'is_delete', data.is_delete);

		return api.put<Company>(API_ENDPOINTS.companies.update(id.toString()), form);
	},

	deleteCompany: async (id: number) => {
		return api.delete(API_ENDPOINTS.companies.delete(id.toString()));
	},
};
