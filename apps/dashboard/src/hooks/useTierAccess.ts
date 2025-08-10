import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserTier = 'invited' | 'basic' | 'pro' | 'suite';

interface TierAccess {
  tier: UserTier | null;
  loading: boolean;
  isInvited: boolean;
  isBasic: boolean;
  isPro: boolean;
  isSuite: boolean;
  hasMinimumTier: (requiredTier: UserTier) => boolean;
  canAccessPremiumContent: boolean;
  canAccessSuiteFeatures: boolean;
}

const tierHierarchy: Record<UserTier, number> = {
  invited: 0,
  basic: 1,
  pro: 2,
  suite: 3
};

export const useTierAccess = (): TierAccess => {
  const { user } = useAuth();
  const [tier, setTier] = useState<UserTier | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for localhost development
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // 🧪 TESTING: Change this value to test different tier access
  // Options: 'invited', 'basic', 'pro', 'suite'
  // NOTE: Should match the mockTier in CMSHeader.tsx for consistency
  const mockTier: UserTier = 'pro';

  useEffect(() => {
    const fetchUserTier = async () => {
      // Use mock data on localhost
      if (isLocalhost) {
        console.log('🧪 useTierAccess: Using localhost mock tier:', mockTier);
        setTier(mockTier);
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setTier(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_buyers')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user tier:', error);
          setTier('invited'); // Default to most restrictive
        } else {
          setTier(data.tier || 'invited');
        }
      } catch (error) {
        console.error('Exception fetching user tier:', error);
        setTier('invited'); // Default to most restrictive
      } finally {
        setLoading(false);
      }
    };

    fetchUserTier();
  }, [user?.id, isLocalhost, mockTier]);

  const hasMinimumTier = (requiredTier: UserTier): boolean => {
    if (!tier) return false;
    return tierHierarchy[tier] >= tierHierarchy[requiredTier];
  };

  return {
    tier,
    loading,
    isInvited: tier === 'invited',
    isBasic: tier === 'basic',
    isPro: tier === 'pro',
    isSuite: tier === 'suite',
    hasMinimumTier,
    canAccessPremiumContent: hasMinimumTier('pro'),
    canAccessSuiteFeatures: hasMinimumTier('suite')
  };
};