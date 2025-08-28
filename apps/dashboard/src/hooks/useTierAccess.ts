import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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

  // Localhost development configuration
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // 🧪 LOCALHOST CONFIG: Control data source for development
  // Set to true to use real Supabase data, false for mock data
  const useRealDataOnLocalhost = true; // Now using real data for localhost testing

  // 🧪 MOCK TESTING: Change this value when using mock data
  // Options: 'invited', 'basic', 'pro', 'suite'
  // NOTE: Should match the mockTier in CMSHeader.tsx for consistency
  const mockTier: UserTier = 'basic';

  // Test email for real data queries (replace with your test account)
  const testEmail = 'sungho@dadble.com';

  useEffect(() => {
    const fetchUserTier = async () => {
      // Handle localhost development
      if (isLocalhost && !useRealDataOnLocalhost) {
        console.log('🧪 useTierAccess: Using localhost mock tier:', mockTier);
        setTier(mockTier);
        setLoading(false);
        return;
      }

      // For localhost with real data, use test email
      const queryEmail = isLocalhost && useRealDataOnLocalhost ? testEmail : user?.email;

      if (!user?.id) {
        setTier(null);
        setLoading(false);
        return;
      }

      try {
        if (isLocalhost && useRealDataOnLocalhost) {
          console.log('🔍 useTierAccess: Using real Supabase data on localhost for:', testEmail);
        } else {
          console.log('🔍 useTierAccess: Fetching tier for user:', { id: user?.id, email: user?.email });
        }

        // Query by email since user_id column doesn't exist yet
        const { data, error } = await supabase
          .from('user_buyers')
          .select('tier, email')
          .eq('email', queryEmail)
          .single();

        console.log('🔍 useTierAccess: Query by email result:', { data, error, email: queryEmail });

        if (error) {
          console.error('❌ Error fetching user tier:', error);
          console.log('Setting tier to basic due to error');
          setTier('basic'); // Default to basic tier
        } else {
          const finalTier = data.tier || 'basic';
          console.log('✅ Setting tier to:', finalTier, '(raw data.tier:', data.tier, ')');
          setTier(finalTier);
        }
      } catch (error) {
        console.error('❌ Exception fetching user tier:', error);
        console.log('Setting tier to basic due to exception');
        setTier('basic'); // Default to basic tier
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