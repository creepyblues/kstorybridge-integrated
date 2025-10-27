import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useDataCache } from '@/contexts/DataCacheContext';

/**
 * Hook to manage session-based cache lifecycle
 * Integrates authentication with data cache management
 */
export function useSessionCache() {
  const { user, session, loading } = useAuth();
  const {
    initializeSession,
    clearCache,
    isSessionValid,
    setDbConnectivityStatus,
    getDbConnectivityStatus
  } = useDataCache();

  // Initialize cache session when user logs in
  useEffect(() => {
    if (!loading && user && session) {
      // Initialize new cache session with Supabase session ID
      initializeSession(session.access_token);
      console.log('🔐 Session cache initialized for user:', user.email);
    }
  }, [user, session, loading, initializeSession]);

  // Clear cache when user logs out
  useEffect(() => {
    if (!loading && !user) {
      clearCache();
      console.log('🧹 Cache cleared - user logged out');
    }
  }, [user, loading, clearCache]);

  // Monitor session validity and clear cache if expired
  useEffect(() => {
    if (!user) return;

    const checkSessionValidity = () => {
      if (!isSessionValid()) {
        console.log('⏰ Session cache expired, clearing and logging out...');
        clearCache();
        // Note: We don't auto-logout here as that should be handled by auth system
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionValidity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, isSessionValid, clearCache]);

  return {
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus
  };
}