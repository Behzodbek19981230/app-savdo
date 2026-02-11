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
		list: '/filial',
		byId: (id: string) => `/filial/${id}`,
		create: '/filial',
		update: (id: string) => `/filial/${id}`,
		delete: (id: string) => `/filial/${id}`,
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

	// Product Category endpoints (Bo'limlar)
	productCategories: {
		list: '/product-branch',
		byId: (id: string) => `/product-branch/${id}`,
		create: '/product-branch',
		update: (id: string) => `/product-branch/${id}`,
		delete: (id: string) => `/product-branch/${id}`,
	},

	// Product Branch Category endpoints (Mahsulot turlari kategoriyasi)
	productBranchCategories: {
		list: '/product-branch-category',
		byId: (id: string) => `/product-branch-category/${id}`,
		create: '/product-branch-category/',
		update: (id: string) => `/product-branch-category/${id}`,
		delete: (id: string) => `/product-branch-category/${id}`,
	},

	// Product Model endpoints
	productModels: {
		list: '/product-model',
		byId: (id: string) => `/product-model/${id}`,
		create: '/product-model',
		update: (id: string) => `/product-model/${id}`,
		delete: (id: string) => `/product-model/${id}`,
	},

	// Model Size endpoints
	modelSizes: {
		list: '/product-type-size',
		byId: (id: string) => `/product-type-size/${id}`,
		create: '/product-type-size',
		update: (id: string) => `/product-type-size/${id}`,
		delete: (id: string) => `/product-type-size/${id}`,
	},

	// Model Type endpoints
	modelTypes: {
		list: '/product-type',
		byId: (id: string) => `/product-type/${id}`,
		create: '/product-type',
		createBulk: '/product-type/create',
		update: (id: string) => `/product-type/${id}`,
		delete: (id: string) => `/product-type/${id}`,
	},

	// Exchange Rate endpoints
	exchangeRate: {
		list: '/exchange-rate',
		byId: (id: string) => `/exchange-rate/${id}`,
		create: '/exchange-rate',
		update: (id: string) => `/exchange-rate/${id}`,
		delete: (id: string) => `/exchange-rate/${id}`,
	},

	// Purchase Invoice endpoints (Tovar kirimi / Faktura)
	purchaseInvoices: {
		list: '/purchase-invoice',
		byId: (id: string) => `/purchase-invoice/${id}`,
		create: '/purchase-invoice',
		update: (id: string) => `/purchase-invoice/${id}`,
		delete: (id: string) => `/purchase-invoice/${id}`,
	},

	// Product History endpoints (Kirim bo'lgan mahsulotlar tarixi)
	productHistories: {
		list: '/product-history',
		byId: (id: string) => `/product-history/${id}`,
		create: '/product-history',
		update: (id: string) => `/product-history/${id}`,
		delete: (id: string) => `/product-history/${id}`,
	},

	// Supplier endpoints (Ta'minotchilar)
	suppliers: {
		list: '/supplier',
		byId: (id: string) => `/supplier/${id}`,
		create: '/supplier',
		update: (id: string) => `/supplier/${id}`,
		delete: (id: string) => `/supplier/${id}`,
	},

	// Sklad (Warehouse) endpoints
	sklads: {
		list: '/sklad',
		byId: (id: string) => `/sklad/${id}`,
		create: '/sklad',
		update: (id: string) => `/sklad/${id}`,
		delete: (id: string) => `/sklad/${id}`,
	},

	// Unit endpoints (O'lchov birliklari - kg, ta, dona, etc.)
	units: {
		list: '/unit',
		byId: (id: string) => `/unit/${id}`,
		create: '/unit',
		update: (id: string) => `/unit/${id}`,
		delete: (id: string) => `/unit/${id}`,
	},

	// Product Type Size endpoints (Mahsulot turi o'lchamlari)
	productTypeSizes: {
		list: '/product-type-size',
		byId: (id: string) => `/product-type-size/${id}`,
		create: '/product-type-size',
		update: (id: string) => `/product-type-size/${id}`,
		delete: (id: string) => `/product-type-size/${id}`,
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
