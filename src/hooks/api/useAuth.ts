/**
 * Auth Hooks
 * React Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginCredentials, type RegisterData, type User } from '@/services';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const AUTH_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
};

/**
 * Login mutation
 */
export function useLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Update query cache
      queryClient.setQueryData(AUTH_KEYS.currentUser, data.user);
      
      toast({
        title: 'Xush kelibsiz!',
        description: 'Tizimga muvaffaqiyatli kirdingiz.',
      });
      
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Email yoki parol noto\'g\'ri.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      // Update query cache
      queryClient.setQueryData(AUTH_KEYS.currentUser, data.user);
      
      toast({
        title: 'Ro\'yxatdan o\'tdingiz!',
        description: 'Hisobingiz muvaffaqiyatli yaratildi.',
      });
      
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      
      toast({
        title: 'Tizimdan chiqdingiz',
        description: 'Xayr, yana ko\'rishguncha!',
      });
      
      navigate('/login');
    },
    onError: (error: any) => {
      // Even on error, clear local storage and redirect
      queryClient.clear();
      navigate('/login');
    },
  });
}

/**
 * Get current user query
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: authService.isAuthenticated(),
  });
}

/**
 * Check authentication status
 */
export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
