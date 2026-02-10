/**
 * User (AppUser) Types
 *
 * {
 *   "username": "string",
 *   "full_name": "string",
 *   "is_active": true,
 *   "date_of_birthday": "string",
 *   "gender": "string",
 *   "phone_number": "string",
 *   "email": "string",
 *   "password": "string",
 *   "companies": ["string"],
 *   "region": 0,
 *   "district": 0,
 *   "roles": ["string"],
 *   "address": "string",
 *   "avatar": "string",
 *   "created_by": 0,
 *   "updated_by": 0
 * }
 */

export interface AppUser {
    id: number;
    username: string;
    full_name: string;
    is_active: boolean;
    date_of_birthday: string | null;
    gender: string | null;
    phone_number: string | null;
    email: string | null;
    password?: string;
    filials: number[];
    filials_detail?: { id: number; name: string }[];
    region: number | null;
    district: number | null;
    roles: number[];
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

export interface AppUserQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    ordering?: string;
    is_active?: boolean;
}

export interface CreateAppUserPayload {
    username: string;
    full_name: string;
    is_active: boolean;
    date_of_birthday?: string;
    gender?: string;
    phone_number?: string;
    email?: string;
    password: string;
    companies?: number[];
    region?: number;
    district?: number;
    roles: number[];
    address?: string;
    avatar?: File;
    order_filial?: number | null;
}

export type UpdateAppUserPayload = Partial<CreateAppUserPayload>;
