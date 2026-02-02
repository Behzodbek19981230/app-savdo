/**
 * Role Service
 * Rollar bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

export interface Role {
  id: number;
  name: string;
  description: string;
  sorting?: number | null;
  is_delete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleListResponse {
  pagination: PaginationMeta;
  results: Role[];
  filters: unknown;
}

export interface RoleQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  ordering?: string;
  is_delete?: boolean;
}

export const roleService = {
  getRoles: async (params?: RoleQueryParams) => {
    return api.get<RoleListResponse>(API_ENDPOINTS.roles.list, { params });
  },

  getRoleById: async (id: number) => {
    return api.get<Role>(API_ENDPOINTS.roles.byId(id.toString()));
  },

  createRole: async (data: Pick<Role, 'name' | 'description'>) => {
    return api.post<Role>(API_ENDPOINTS.roles.create, data);
  },

  updateRole: async (id: number, data: Partial<Pick<Role, 'name' | 'description'>>) => {
    return api.patch<Role>(API_ENDPOINTS.roles.update(id.toString()), data);
  },

  deleteRole: async (id: number) => {
    return api.delete(API_ENDPOINTS.roles.delete(id.toString()));
  },
};
