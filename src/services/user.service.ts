/**
 * User Service
 * Admin users bilan ishlash uchun service
 *
 * NOTE: created_by / updated_by formdan olinmaydi (backend o'zi to'ldiradi)
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';
import type { AppUser, AppUserQueryParams, CreateAppUserPayload, UpdateAppUserPayload } from '@/types/user';

export type { AppUser, AppUserQueryParams, CreateAppUserPayload, UpdateAppUserPayload };

export interface AppUserListResponse {
	pagination: PaginationMeta;
	results: AppUser[];
	filters: unknown;
}

const appendIfDefined = (form: FormData, key: string, value: unknown) => {
	if (value === undefined || value === null) return;
	// bo'sh string yuborish kerak bo'lsa, caller string berishi mumkin
	form.append(key, String(value));
};

const toUserFormData = (data: Partial<CreateAppUserPayload>) => {
	const form = new FormData();
	appendIfDefined(form, 'username', data.username);
	appendIfDefined(form, 'full_name', data.full_name);
	if (typeof data.is_active === 'boolean') form.append('is_active', data.is_active ? 'true' : 'false');
	appendIfDefined(form, 'date_of_birthday', data.date_of_birthday);
	appendIfDefined(form, 'gender', data.gender);
	appendIfDefined(form, 'phone_number', data.phone_number);
	appendIfDefined(form, 'email', data.email);
	appendIfDefined(form, 'password', data.password);
	if (Array.isArray(data.companies)) {
		data.companies.forEach((cid) => form.append('filials', String(cid)));
	}
	if (typeof data.region === 'number') form.append('region', String(data.region));
	if (typeof data.district === 'number') form.append('district', String(data.district));
	if (Array.isArray(data.roles)) {
		data.roles.forEach((rid) => form.append('roles', String(rid)));
	}
	appendIfDefined(form, 'address', data.address);
	if (typeof data.order_filial === 'number') form.append('order_filial', String(data.order_filial));
	if (data.avatar) form.append('avatar', data.avatar);
	return form;
};

export const userService = {
	getUsers: async (params?: AppUserQueryParams) => {
		return api.get<AppUserListResponse>(API_ENDPOINTS.appUsers.list, { params });
	},

	getUserById: async (id: number) => {
		return api.get<AppUser>(API_ENDPOINTS.appUsers.byId(id.toString()));
	},

	createUser: async (data: CreateAppUserPayload) => {
		const form = toUserFormData({
			...data,
			// optional strings: backend ko'pincha '' ni ham qabul qiladi
			date_of_birthday: data.date_of_birthday ?? '',
			gender: data.gender ?? '',
			phone_number: data.phone_number ?? '',
			email: data.email ?? '',
			address: data.address ?? '',
		});
		return api.post<AppUser>(API_ENDPOINTS.appUsers.create, form);
	},

	updateUser: async (id: number, data: UpdateAppUserPayload) => {
		const form = toUserFormData({
			...data,
			// update paytida password bo'sh bo'lsa umuman yuborilmaydi (caller delete qiladi)
		});
		return api.patch<AppUser>(API_ENDPOINTS.appUsers.update(id.toString()), form);
	},

	deleteUser: async (id: number) => {
		return api.delete(API_ENDPOINTS.appUsers.delete(id.toString()));
	},
};
