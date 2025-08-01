import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { adminProfile, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-hanok-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-midnight-ink-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminProfile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}