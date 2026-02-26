import { api } from '@/lib/api/client';

export interface SupplierAccountItem {
    id: number;
    supplier?: number;
    supplier_detail?: {
        id: number;
        name?: string;
        phone_number?: string;
        type?: string | null;
        filial?: number;
        filial_detail?: {
            id: number;
            name?: string;
            region?: number;
            region_detail?: {
                id: number;
                code?: string;
                name?: string;
            };
            district?: number;
            district_detail?: {
                id: number;
                code?: string;
                name?: string;
                region?: number;
            };
            address?: string;
            phone_number?: string | null;
            logo?: string | null;
            is_active?: boolean;
            is_delete?: boolean;
            is_head_office?: boolean;
        };
        region?: number;
        region_detail?: {
            id: number;
            code?: string;
            name?: string;
        };
        district?: number;
        district_detail?: {
            id: number;
            code?: string;
            name?: string;
            region?: number;
        };
        address?: string;
        inn?: number | null;
        note?: string;
        is_active?: boolean;
        is_delete?: boolean;
    };
    purchase_invoice?: number;
    purchase_invoice_detail?: {
        id: number;
        invoice_number?: string;
        date?: string;
    };
    summa_total_dollar?: string;
    summa_dollar?: string;
    summa_naqt?: string;
    summa_kilik?: string;
    summa_terminal?: string;
    summa_transfer?: string;
    date?: string;
    note?: string;
    created_time?: string;
    total_turnover?: string | number;
    filial_debt?: string | number;
}

export interface CreateSupplierAccountPayload {
    supplier: number;
    total_turnover: number;
    filial_debt: number;
}

export interface UpdateSupplierAccountPayload extends Partial<CreateSupplierAccountPayload> {}

export interface SupplierAccountDateGroup {
    date: string;
    count: number;
    items: SupplierAccountItem[];
}

export interface SupplierAccountListResponse {
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: SupplierAccountItem[] | SupplierAccountDateGroup[];
    filters?: unknown;
}

export interface SupplierDebtRepaymentItem {
    id: number;
    supplier?: number;
    supplier_detail?: {
        id: number;
        name?: string;
        phone_number?: string;
    };
    employee?: number;
    employee_detail?: {
        id: number;
        username?: string;
        full_name?: string;
    };
    summa_total_dollar?: string;
    summa_dollar?: string;
    summa_naqt?: string;
    summa_kilik?: string;
    summa_terminal?: string;
    summa_transfer?: string;
    date?: string;
    note?: string;
    created_time?: string;
    total_debt_old?: number;
    total_debt?: number;
}

export interface CreateSupplierDebtRepaymentPayload {
    supplier: number;
    employee: number;
    date: string;
    total_debt_old: number;
    total_debt: number;
    summa_total_dollar: number;
    summa_dollar: number;
    summa_naqt: number;
    summa_kilik: number;
    summa_terminal: number;
    summa_transfer: number;
}

export interface UpdateSupplierDebtRepaymentPayload extends Partial<CreateSupplierDebtRepaymentPayload> {}

export interface SupplierDebtRepaymentDateGroup {
    date: string;
    count: number;
    items: SupplierDebtRepaymentItem[];
}

export interface SupplierDebtRepaymentListResponse {
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: SupplierDebtRepaymentDateGroup[];
    filters?: unknown;
}

export const supplierAccountService = {
    getList: async (params?: Record<string, unknown>) => {
        return api.get<SupplierAccountListResponse>('/supplier-account', { params });
    },
    getById: async (id: number) => {
        return api.get<SupplierAccountItem>(`/supplier-account/${id}`);
    },
    create: async (payload: CreateSupplierAccountPayload) => {
        return api.post<SupplierAccountItem>('/supplier-account', payload);
    },
    update: async (id: number, payload: UpdateSupplierAccountPayload) => {
        return api.put<SupplierAccountItem>(`/supplier-account/${id}`, payload);
    },
    delete: async (id: number) => {
        return api.delete(`/supplier-account/${id}`);
    },
    getDebtRepaymentList: async (params?: Record<string, unknown>) => {
        return api.get<SupplierDebtRepaymentListResponse>('/supplier-debt-repayment', { params });
    },
    getDebtRepaymentById: async (id: number) => {
        return api.get<SupplierDebtRepaymentItem>(`/supplier-debt-repayment/${id}`);
    },
    createDebtRepayment: async (payload: CreateSupplierDebtRepaymentPayload) => {
        return api.post<SupplierDebtRepaymentItem>('/supplier-debt-repayment', payload);
    },
    updateDebtRepayment: async (id: number, payload: UpdateSupplierDebtRepaymentPayload) => {
        return api.put<SupplierDebtRepaymentItem>(`/supplier-debt-repayment/${id}`, payload);
    },
    deleteDebtRepayment: async (id: number) => {
        return api.delete(`/supplier-debt-repayment/${id}`);
    },
};
