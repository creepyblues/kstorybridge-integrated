import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper for admin-only pages
 *
 * Checks if user is authenticated and is an admin (exists in admin table).
 * Non-admins are redirected to /buyers/chat.
 *
 * Usage:
 * ```tsx
 * <Route path="/admin/titles" element={
 *   <AdminProtectedRoute>
 *     <AdminTitles />
 *   </AdminProtectedRoute>
 * } />
 * ```
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdmin, isLoading } = useAdminAuth();

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/buyers/chat" replace />;
  }

  return <>{children}</>;
}
