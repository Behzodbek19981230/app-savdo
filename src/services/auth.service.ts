/**
 * Auth Service
 * Authentication bilan bog'liq barcha API chaqiruvlari
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Company {
  id: number;
  name: string;
  // Add other company fields as needed
}

export interface User {
  id: number;
  username: string;
  fullname: string;
  is_active: boolean;
  date_of_birthday: string;
  gender: 'male' | 'female' | 'other';
  phone_number: string;
  avatar: string | null;
  email: string;
  date_joined: string;
  roles: number[];
  role_detail: Role[];
  password: string;
  region: number;
  district: number;
  address: string;
  companies: number[];
  companies_detail: Company[];
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  passwordConfirmation: string;
}

// Auth Service
export const authService = {
  /**
   * Login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );
    
    // Save tokens to localStorage
    if (response.access) {
      localStorage.setItem('smartAccessToken', response.access);
      localStorage.setItem('smartRefreshToken', response.refresh);
      
      // Save user if included in response
      if (response.user) {
        localStorage.setItem('smartUser', JSON.stringify(response.user));
      }
    }
    
    return response;
  },

  /**
   * Register
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.auth.register,
      data
    );
    
    // Save tokens to localStorage
    if (response.access) {
      localStorage.setItem('smartAccessToken', response.access);
      localStorage.setItem('smartRefreshToken', response.refresh);
    }
    
    return response;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.auth.logout);
    } finally {
      // Clear localStorage
      localStorage.removeItem('smartAccessToken');
      localStorage.removeItem('smartRefreshToken');
      localStorage.removeItem('smartUser');
      localStorage.removeItem('isAuthenticated');
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>(API_ENDPOINTS.auth.me);
    
    // Update user in localStorage
    localStorage.setItem('smartUser', JSON.stringify(response));
    
    return response;
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post<{ accessToken: string }>(
      API_ENDPOINTS.auth.refreshToken,
      { refreshToken }
    );
    
    // Update access token
    if (response.accessToken) {
      localStorage.setItem('smartAccessToken', response.accessToken);
    }
    
    return response;
  },

  /**
   * Forgot password
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.auth.forgotPassword, data);
  },

  /**
   * Reset password
   */
  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.auth.resetPassword, data);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('smartAccessToken');
    return !!token;
  },

  /**
   * Get user from localStorage
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('smartUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};
