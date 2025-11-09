import { useSessionCache } from '@/hooks/useSessionCache';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { setDirectApiAccessToken } from '@/services/directApiService';

/**
 * SessionCacheInitializer - Component to initialize session cache
 * This should be rendered once at the app level, inside DataCacheProvider
 */
export function SessionCacheInitializer({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  // Initialize session cache lifecycle
  useSessionCache();

  // Set access token for directApiService
  useEffect(() => {
    if (session?.access_token) {
      setDirectApiAccessToken(session.access_token);
    } else {
      setDirectApiAccessToken(null);
    }
  }, [session]);

  return <>{children}</>;
}
