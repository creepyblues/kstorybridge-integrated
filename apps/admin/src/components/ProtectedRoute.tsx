import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AlertCircle, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { adminProfile, isLoading, user } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-hanok-teal rounded-full flex items-center justify-center mb-4 mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-hanok-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-midnight-ink-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but no admin profile, show access denied
  if (user && !adminProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-midnight-ink mb-2">Access Denied</h2>
          <p className="text-midnight-ink-600 mb-6">
            You are authenticated but do not have admin access. Contact IT support if you believe this is an error.
          </p>
          <p className="text-sm text-midnight-ink-400 mb-4">
            Email: {user.email}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="text-hanok-teal hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If no user at all, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If we have both user and admin profile, allow access
  if (adminProfile) {
    return <>{children}</>;
  }

  // Fallback to login
  return <Navigate to="/login" replace />;
}