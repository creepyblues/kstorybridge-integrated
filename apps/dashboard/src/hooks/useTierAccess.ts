import { useAuth } from '@/hooks/useAuth';
import { directApiService } from '@/services/directApiService';
import { useEffect, useState } from 'react';

type UserTier = 'basic' | 'pro' | 'suite';

interface TierAccess {
  tier: UserTier | null;
  loading: boolean;
  isBasic: boolean;
  isPro: boolean;
  isSuite: boolean;
  hasMinimumTier: (requiredTier: UserTier) => boolean;
  canAccessPremiumContent: boolean;
  canAccessSuiteFeatures: boolean;
}

const tierHierarchy: Record<UserTier, number> = {
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
  // Options: 'basic', 'pro', 'suite'
  // NOTE: Should match the mockTier in CMSHeader.tsx for consistency
  const mockTier: UserTier = 'basic';

  // Test email for real data queries (replace with your test account)
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
      const queryId = user.id;

      if (!user?.id) {
        setTier(null);
        setLoading(false);
        return;
      }

      // Check if user is a creator - creators don't have tiers
      const accountType = user?.user_metadata?.account_type;
      if (accountType === 'creator') {
        console.log('🎨 useTierAccess: User is a creator, skipping tier query');
        setTier(null); // Creators don't have tiers
        setLoading(false);
        return;
      }

      try {
        if (isLocalhost && useRealDataOnLocalhost) {
          console.log('🔍 useTierAccess: Using real Supabase data on localhost for user id:', queryId);
        } else {
          console.log('🔍 useTierAccess: Fetching tier for buyer user:', { id: user?.id, email: user?.email });
        }

        // Use the working direct API service instead of hanging Supabase JS
        const userTier = await directApiService.getUserTier(queryId);

        console.log('🔍 useTierAccess: Direct API result:', { tier: userTier, id: queryId });

        if (userTier) {
          console.log('✅ Setting tier to:', userTier);
          setTier(userTier);
        } else {
          console.warn('⚠️ No tier found for user, treating as unassigned');
          setTier(null);
        }
      } catch (error) {
        console.error('❌ Exception fetching user tier:', error);
        setTier(null);
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
    isBasic: tier === 'basic',
    isPro: tier === 'pro',
    isSuite: tier === 'suite',
    hasMinimumTier,
    canAccessPremiumContent: hasMinimumTier('pro'),
    canAccessSuiteFeatures: hasMinimumTier('suite')
  };
};
