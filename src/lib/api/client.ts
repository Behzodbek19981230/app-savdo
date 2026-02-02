/**
 * API Client
 * Axios-based HTTP client with interceptors
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from './config';

// Custom error type
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Token qo'shish
    const token = localStorage.getItem('smartAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData bo'lsa Content-Type ni majburlab qo'ymaslik kerak
    // (axios boundary'ni o'zi qo'shadi)
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        // axios v1 da headers object yoki AxiosHeaders bo'lishi mumkin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headers: any = config.headers;
        delete headers['Content-Type'];
        delete headers['content-type'];
      }
    }
    
    // Request log (development mode)
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Response log (development mode)
    if (import.meta.env.DEV) {
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Token muddati tugagan bo'lsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Refresh token bilan yangi access token olish
        const refreshToken = localStorage.getItem('smartRefreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('smartAccessToken', accessToken);
          
          // Original request'ni qayta yuborish
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token ham ishlamasa, logout qilish
        localStorage.removeItem('smartAccessToken');
        localStorage.removeItem('smartRefreshToken');
        localStorage.removeItem('smartUser');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Error log (development mode)
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }
    
    // Custom error format
    const responseData = error.response?.data as Record<string, unknown> | undefined;
    const apiError: ApiError = {
      message: (responseData?.message as string) || error.message || 'Xatolik yuz berdi',
      status: error.response?.status,
      code: responseData?.code as string | undefined,
      errors: responseData?.errors as Record<string, string[]> | undefined,
    };
    
    return Promise.reject(apiError);
  }
);

// Generic request method
export async function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.request<T>({
    method,
    url,
    data,
    ...config,
  });
  return response.data;
}

// Convenience methods
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    request<T>('GET', url, undefined, config),
  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    request<T>('POST', url, data, config),
  
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    request<T>('PUT', url, data, config),
  
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    request<T>('PATCH', url, data, config),
  
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    request<T>('DELETE', url, undefined, config),
};

export default apiClient;
