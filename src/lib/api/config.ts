/**
 * API Configuration
 * Bu faylda API uchun asosiy konfiguratsiyalar
 */

// API Base URL - production da o'zgartirish kerak
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth endpoints
    auth: {
        login: '/auth/token',
        logout: '/auth/logout',
        register: '/auth/register',
        refreshToken: '/auth/token/refresh',
        me: '/user-view',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
    },

    // User endpoints
    users: {
        list: '/users',
        byId: (id: string) => `/users/${id}`,
        create: '/users',
        update: (id: string) => `/users/${id}`,
        delete: (id: string) => `/users/${id}`,
    },

    // Role endpoints
    roles: {
        list: '/role',
        byId: (id: string) => `/role/${id}`,
        create: '/role',
        update: (id: string) => `/role/${id}`,
        delete: (id: string) => `/role/${id}`,
    },

    // App User endpoints (admin users)
    // NOTE: Frontend route: /user, backend endpoint: /user
    appUsers: {
        list: '/user',
        byId: (id: string) => `/user/${id}`,
        create: '/user',
        update: (id: string) => `/user/${id}`,
        delete: (id: string) => `/user/${id}`,
    },

    // Company endpoints
    // NOTE: Frontend route: /company, backend endpoint: /company
    companies: {
        list: '/company',
        byId: (id: string) => `/company/${id}`,
        create: '/company',
        update: (id: string) => `/company/${id}/`,
        delete: (id: string) => `/company/${id}`,
    },

    // Customer endpoints
    customers: {
        list: '/customers',
        byId: (id: string) => `/customers/${id}`,
        create: '/customers',
        update: (id: string) => `/customers/${id}`,
        delete: (id: string) => `/customers/${id}`,
        search: '/customers/search',
    },

    // Order endpoints
    orders: {
        list: '/orders',
        byId: (id: string) => `/orders/${id}`,
        create: '/orders',
        update: (id: string) => `/orders/${id}`,
        delete: (id: string) => `/orders/${id}`,
        recent: '/orders/recent',
    },

    // Product endpoints
    products: {
        list: '/product',
        byId: (id: string) => `/product/${id}`,
        create: '/product',
        update: (id: string) => `/product/${id}`,
        delete: (id: string) => `/product/${id}`,
        top: '/products/top',
    },

    // Product Image endpoints
    // NOTE: Backend endpoint nomi shu bo'lishi kerak: /product-image
    productImages: {
        list: '/product-image',
        byId: (id: string) => `/product-image/${id}`,
        create: '/product-image',
        update: (id: string) => `/product-image/${id}`,
        delete: (id: string) => `/product-image/${id}`,
    },

    // Analytics endpoints
    analytics: {
        dashboard: '/analytics/dashboard',
        revenue: '/analytics/revenue',
        sales: '/analytics/sales',
    },

    // Location endpoints
    locations: {
        countries: '/country',
        regions: '/region',
        districts: '/district',
        countryById: (id: string) => `/country/${id}`,
        regionById: (id: string) => `/region/${id}`,
        districtById: (id: string) => `/district/${id}`,
    },

    // Product Category endpoints
    productCategories: {
        list: '/product-category',
        byId: (id: string) => `/product-category/${id}`,
        create: '/product-category',
        update: (id: string) => `/product-category/${id}`,
        delete: (id: string) => `/product-category/${id}`,
    },

    // Product Model endpoints
    productModels: {
        list: '/model',
        byId: (id: string) => `/model/${id}`,
        create: '/model',
        update: (id: string) => `/model/${id}`,
        delete: (id: string) => `/model/${id}`,
    },

    // Model Size endpoints
    modelSizes: {
        list: '/model-size',
        byId: (id: string) => `/model-size/${id}`,
        create: '/model-size',
        update: (id: string) => `/model-size/${id}`,
        delete: (id: string) => `/model-size/${id}`,
    },

    // Model Type endpoints
    modelTypes: {
        list: '/model-type',
        byId: (id: string) => `/model-type/${id}`,
        create: '/model-type',
        update: (id: string) => `/model-type/${id}`,
        delete: (id: string) => `/model-type/${id}`,
    },
} as const;

// Request timeout (milliseconds)
export const REQUEST_TIMEOUT = 30000;

// Retry configuration
export const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};
