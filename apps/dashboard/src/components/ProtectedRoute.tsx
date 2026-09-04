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

    // Title pages: send anonymous visitors to the in-app public preview
    // (/titles/:slug) instead of a bare sign-in form. redirect_after_login is
    // already stashed above, so the preview's CTAs bring them back here.
    const titleMatch = location.pathname.match(/^\/buyers\/titles\/([^/]+)\/?$/);
    if (titleMatch) {
      return <Navigate to={`/titles/${titleMatch[1]}`} replace />;
    }

    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
