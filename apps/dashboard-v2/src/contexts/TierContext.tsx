import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// 🚨 BUSINESS LOGIC - NOT AUTH
// This context manages tier/billing features
// It MUST NOT block authentication flow

export type UserTier = 'basic' | 'invited' | 'pro' | 'suite';

interface TierContextType {
  tier: UserTier;
  loading: boolean;
  hasAccess: (requiredTier: UserTier) => boolean;
  refetch: () => Promise<void>;
  error: string | null;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

const tierHierarchy: Record<UserTier, number> = {
  invited: 0,
  basic: 1,
  pro: 2,
  suite: 3,
};

const TIER_FETCH_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Timeout wrapper for async operations
 * Fails fast to prevent blocking the app
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export function TierProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [tier, setTier] = useState<UserTier>('basic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTier = async () => {
    if (!user || !session) {
      setTier('basic');
      setLoading(false);
      setError(null);
      return;
    }

    try {
      // Wrap database query with timeout protection
      const result = await withTimeout(
        supabase
          .from('user_buyers')
          .select('tier')
          .eq('id', user.id)
          .maybeSingle() as unknown as Promise<any>,
        TIER_FETCH_TIMEOUT_MS,
        'Tier fetch'
      );

      const { data, error: queryError } = result as any;

      if (queryError) {
        console.error('[TierProvider] Query error:', queryError);
        // Fail-safe: Default to 'basic' tier on error, don't block app
        setTier('basic');
        setError('Unable to load subscription tier. Defaulting to basic access.');
      } else if (data) {
        setTier(data.tier as UserTier);
        setError(null);
      } else {
        // Profile doesn't exist yet (e.g., during OAuth flow)
        // Fail-safe: Default to 'basic', let profile creation complete
        console.warn('[TierProvider] No buyer profile found, defaulting to basic tier');
        setTier('basic');
        setError(null);
      }
    } catch (err: any) {
      console.error('[TierProvider] Fetch error:', err);
      // Fail-safe: Always default to 'basic' on any error
      setTier('basic');
      setError(
        err.message?.includes('timed out')
          ? 'Tier check timed out. Using basic access.'
          : 'Unable to load subscription tier. Using basic access.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTier();
  }, [user, session]);

  const hasAccess = (requiredTier: UserTier): boolean => {
    return tierHierarchy[tier] >= tierHierarchy[requiredTier];
  };

  const refetch = async () => {
    setLoading(true);
    await fetchTier();
  };

  return (
    <TierContext.Provider value={{ tier, loading, hasAccess, refetch, error }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTierAccess() {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTierAccess must be used within a TierProvider');
  }
  return context;
}
