/**
 * Supplier Types
 *
 * Ta'minotchilar jadvali
 * Table Supplier {
 *   id int [pk, increment]
 *   name varchar
 *   filial int [ref: > Filial.id]
 *   region int [ref: > Region.id]
 *   district int [ref: > District.id]
 *   address text
 *   inn int
 *   note text
 *   is_active bool
 *   is_delete bool
 * }
 */

export interface Supplier {
    id: number;
    name: string;
    filial: number;
    filial_detail?: {
        id: number;
        name: string;
    };
    region: number;
    region_detail?: {
        id: number;
        code: string;
        name: string;
    };
    district: number;
    district_detail?: {
        id: number;
        code: string;
        name: string;
        region: number;
    };
    address?: string;
    inn?: number;
    note?: string;
    is_active?: boolean;
    is_delete?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SupplierQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    ordering?: string;
    is_delete?: boolean;
    is_active?: boolean;
    filial?: number;
    region?: number;
}

export interface CreateSupplierPayload {
    name: string;
    filial: number;
    region: number;
    district: number;
    address?: string;
    inn?: number;
    note?: string;
    is_active?: boolean;
    is_delete?: boolean;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;
