/**
 * Protected Route Component
 * Faqat autentifikatsiya qilingan foydalanuvchilar ko'ra oladigan route'lar
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Guest Route Component
 * Faqat autentifikatsiya qilinmagan foydalanuvchilar ko'ra oladigan route'lar
 */
interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    // If already logged in, redirect to home or the page they came from
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
