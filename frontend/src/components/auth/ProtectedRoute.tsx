import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageSpinner } from '../../components/ui';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: UserRole;
  redirectTo?: string;
}

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * Optionally restricts access to a specific role.
 * Redirects unauthenticated users to /login with the intended path in state.
 */
export default function ProtectedRoute({ children, role, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
