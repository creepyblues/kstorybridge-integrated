import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { testSupabaseConnection } from '@/utils/testSupabase';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { adminProfile, isLoading, user } = useAdminAuth();
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // If user is authenticated but no admin profile after reasonable time, check connection
    if (user && !adminProfile && !isLoading) {
      const timer = setTimeout(async () => {
        const result = await testSupabaseConnection();
        if (!result.success) {
          setConnectionError(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, adminProfile, isLoading]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setConnectionError(false);
    
    const result = await testSupabaseConnection();
    if (result.success) {
      // Trigger a re-authentication check
      window.location.reload();
    } else {
      setConnectionError(true);
    }
    setIsRetrying(false);
  };

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

  // Show connection error if user is authenticated but admin profile failed to load
  if (user && !adminProfile && connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-midnight-ink mb-2">Connection Issue</h2>
          <p className="text-midnight-ink-600 mb-6">
            Unable to verify admin access due to a database connection issue. This may be temporary.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
            >
              {isRetrying ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Retrying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!adminProfile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}