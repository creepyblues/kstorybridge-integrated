import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AlertCircle, Shield, Bug } from 'lucide-react';
import AdminAuthDebug from './AdminAuthDebug';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { adminProfile, isLoading, user, error, clearError, refreshAuth, retryProfileLoad } = useAdminAuth();
  const [showDebug, setShowDebug] = useState(false);

  // If user is present but we don't have an admin profile and we also have an error
  // or loading has already completed, show access denied rather than a spinner
  if (user && !adminProfile && (error || !isLoading)) {
    if (showDebug) {
      return <AdminAuthDebug />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-midnight-ink mb-2">Access Denied</h2>
          <p className="text-midnight-ink-600 mb-4">
            You are authenticated but do not have admin access. Contact IT support if you believe this is an error.
          </p>
          <p className="text-sm text-midnight-ink-400 mb-4">
            Email: {user.email}
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              {error.includes('timeout') && (
                <button
                  onClick={retryProfileLoad}
                  className="mt-2 text-red-700 hover:underline text-sm font-medium block"
                >
                  Retry Profile Load
                </button>
              )}
            </div>
          )}
          <div className="space-y-2">
            <button
              onClick={() => setShowDebug(true)}
              className="flex items-center gap-2 mx-auto text-orange-600 hover:underline mb-4"
            >
              <Bug className="w-4 h-4" />
              Debug Authentication Issue
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="text-hanok-teal hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !adminProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-hanok-teal rounded-full flex items-center justify-center mb-4 mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-hanok-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-midnight-ink-600 mb-2">Verifying admin access...</p>
          {error && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-600 text-sm">{error}</p>
              <button
                onClick={() => {
                  clearError();
                  if (error?.includes('timeout')) {
                    retryProfileLoad();
                  } else {
                    refreshAuth();
                  }
                }}
                className="mt-2 text-orange-700 hover:underline text-sm font-medium"
              >
                {error?.includes('timeout') ? 'Retry Profile Load' : 'Retry Authentication'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user is authenticated but no admin profile, show access denied with debug option
  if (user && !adminProfile) {
    if (showDebug) {
      return <AdminAuthDebug />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-midnight-ink mb-2">Access Denied</h2>
          <p className="text-midnight-ink-600 mb-4">
            You are authenticated but do not have admin access. Contact IT support if you believe this is an error.
          </p>
          <p className="text-sm text-midnight-ink-400 mb-4">
            Email: {user.email}
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              {error.includes('timeout') && (
                <button
                  onClick={retryProfileLoad}
                  className="mt-2 text-red-700 hover:underline text-sm font-medium block"
                >
                  Retry Profile Load
                </button>
              )}
            </div>
          )}
          <div className="space-y-2">
            <button
              onClick={() => setShowDebug(true)}
              className="flex items-center gap-2 mx-auto text-orange-600 hover:underline mb-4"
            >
              <Bug className="w-4 h-4" />
              Debug Authentication Issue
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="text-hanok-teal hover:underline"
            >
              Back to Login
            </button>
          </div>
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