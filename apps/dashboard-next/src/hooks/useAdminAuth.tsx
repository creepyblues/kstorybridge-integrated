import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  active: boolean | null;
  created_at: string | null;
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminProfile: AdminProfile | null;
  error: Error | null;
}

/**
 * Hook to check if current user is an admin
 *
 * Checks the admin table to see if user's email exists and is active.
 * Uses TanStack Query for caching to avoid repeated database calls.
 *
 * Usage:
 * ```tsx
 * const { isAdmin, isLoading } = useAdminAuth();
 *
 * if (isLoading) return <Loading />;
 * if (!isAdmin) return <AccessDenied />;
 * ```
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const { user } = useAuth();

  const { data: adminProfile, isLoading, error } = useQuery({
    queryKey: ['admin-auth', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return null;
      }

      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .eq('active', true)
        .single();

      if (error) {
        // Not found is expected for non-admin users
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as AdminProfile;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

  return {
    isAdmin: !!adminProfile,
    isLoading,
    adminProfile: adminProfile || null,
    error: error as Error | null
  };
}
