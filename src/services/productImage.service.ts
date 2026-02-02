/**
 * Product Image Service
 * Mahsulot rasmlari (galereya) bilan ishlash uchun service
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { PaginationMeta } from './productCategory.service';

export interface ProductImage {
  id: number;
  product: number;
  // backend odatda URL qaytaradi (string)
  file: string;
  sorting?: number | null;
  is_delete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImageListResponse {
  pagination?: PaginationMeta;
  results?: ProductImage[];
  filters?: unknown;
}

export interface ProductImageQueryParams {
  page?: number;
  perPage?: number;
  product?: number;
  ordering?: string;
  is_delete?: boolean;
}

export const productImageService = {
  getProductImages: async (params?: ProductImageQueryParams) => {
    return api.get<ProductImageListResponse | ProductImage[]>(
      API_ENDPOINTS.productImages.list,
      { params }
    );
  },

  createProductImage: async (payload: { product: number; file: File }) => {
    const form = new FormData();
    form.append('product', String(payload.product));
    form.append('file', payload.file);

    return api.post<ProductImage>(API_ENDPOINTS.productImages.create, form);
  },

  updateProductImage: async (payload: { id: number; product: number; file: File }) => {
    const form = new FormData();
    form.append('product', String(payload.product));
    form.append('file', payload.file);

    return api.patch<ProductImage>(API_ENDPOINTS.productImages.update(payload.id.toString()), form);
  },

  deleteProductImage: async (id: number) => {
    return api.delete(API_ENDPOINTS.productImages.delete(id.toString()));
  },
};
