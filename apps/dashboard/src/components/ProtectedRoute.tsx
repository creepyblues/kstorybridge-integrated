import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@iconify/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    const intendedPath = location.pathname + location.search;
    if (intendedPath !== '/' && intendedPath !== '/signin') {
      sessionStorage.setItem('redirect_after_login', intendedPath);
    }
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
