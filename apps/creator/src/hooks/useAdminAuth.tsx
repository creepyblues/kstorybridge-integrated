import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AdminProfile {
  email: string;
  active: boolean;
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminProfile: AdminProfile | null;
  error: Error | null;
}

/**
 * Hook to check if current user has admin access
 * Queries the admin table and caches result for 5 minutes
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-auth', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return null;
      }

      const { data, error } = await supabase
        .from('admin')
        .select('email, active')
        .eq('email', user.email.toLowerCase())
        .eq('active', true)
        .single();

      if (error) {
        // If no admin record found, that's OK (not an error, just not admin)
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
    isAdmin: !!data?.active,
    isLoading,
    adminProfile: data,
    error: error as Error | null
  };
}
