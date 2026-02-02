/**
 * User Service
 * Admin users bilan ishlash uchun service
 *
 * NOTE: created_by / updated_by formdan olinmaydi (backend o'zi to'ldiradi)
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

export interface AppUser {
	id: number;
	username: string;
	full_name: string;
	is_active: boolean;
	date_of_birthday: string | null;
	gender: string | null;
	phone_number: string | null;
	email: string | null;
	// password faqat create/update paytida yuboriladi (listda qaytmasligi mumkin)
	password?: string;
	company: number | null;
	region: number | null;
	district: number | null;
	// backend multi-role qaytarishi mumkin
	roles?: number[];
	role?: string;
	address: string | null;
	avatar: string | null;
	created_by?: number | null;
	updated_by?: number | null;
	created_time?: string | null;
	updated_time?: string | null;
	date_joined?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface AppUserListResponse {
	pagination: PaginationMeta;
	results: AppUser[];
	filters: unknown;
}

export interface AppUserQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	is_active?: boolean;
}

// create/update payload: avatar file bo'ladi (backend avatar URL qaytarishi mumkin)
export type CreateAppUserPayload = {
	username: string;
	full_name: string;
	is_active: boolean;
	date_of_birthday?: string;
	gender?: string;
	phone_number?: string;
	email?: string;
	password: string;
	company?: number;
	region?: number;
	district?: number;
	roles: number[];
	address?: string;
	avatar?: File;
};

export type UpdateAppUserPayload = Partial<CreateAppUserPayload>;

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
	if (typeof data.company === 'number') form.append('company', String(data.company));
	if (typeof data.region === 'number') form.append('region', String(data.region));
	if (typeof data.district === 'number') form.append('district', String(data.district));
	if (Array.isArray(data.roles)) {
		data.roles.forEach((rid) => form.append('roles', String(rid)));
	}
	appendIfDefined(form, 'address', data.address);
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
