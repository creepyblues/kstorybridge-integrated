import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export type UserTier = 'basic' | 'invited' | 'pro' | 'suite';

interface TierContextType {
  tier: UserTier;
  loading: boolean;
  hasAccess: (requiredTier: UserTier) => boolean;
  refetch: () => Promise<void>;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

const tierHierarchy: Record<UserTier, number> = {
  invited: 0,
  basic: 1,
  pro: 2,
  suite: 3,
};

export function TierProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [tier, setTier] = useState<UserTier>('basic');
  const [loading, setLoading] = useState(true);

  const fetchTier = async () => {
    if (!user || !session) {
      setTier('basic');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_buyers')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching tier', error);
        setTier('basic');
      } else if (data) {
        setTier(data.tier as UserTier);
      } else {
        // Profile doesn't exist - user shouldn't be here
        setTier('basic');
      }
    } catch (error) {
      console.error('Tier fetch error', error);
      setTier('basic');
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
    <TierContext.Provider value={{ tier, loading, hasAccess, refetch }}>
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
