import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  refreshTier: () => Promise<void>;
}

const tierHierarchy: Record<UserTier, number> = {
  basic: 1,
  pro: 2,
  suite: 3
};

/**
 * Tier caching constants and helpers
 * Caches tier in localStorage for 24 hours to prevent blocking lookups during outages
 */
const TIER_CACHE_KEY_PREFIX = 'kstorybridge_tier_';
const TIER_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface TierCacheEntry {
  tier: UserTier;
  timestamp: number;
}

function getCachedTier(userId: string): TierCacheEntry | null {
  try {
    const cached = localStorage.getItem(TIER_CACHE_KEY_PREFIX + userId);
    if (!cached) return null;

    const parsed: TierCacheEntry = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age < TIER_CACHE_DURATION) {
      console.log('⚡ useTierAccess: Using cached tier:', parsed.tier, `(${Math.round(age / 1000 / 60)}min old)`);
      return parsed;
    } else {
      console.log('🕐 useTierAccess: Cached tier expired, will fetch fresh');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ useTierAccess: Failed to read tier cache:', error);
    return null;
  }
}

function setCachedTier(userId: string, tier: UserTier): void {
  try {
    const entry: TierCacheEntry = {
      tier,
      timestamp: Date.now()
    };
    localStorage.setItem(TIER_CACHE_KEY_PREFIX + userId, JSON.stringify(entry));
    console.log('💾 useTierAccess: Cached tier:', tier);
  } catch (error) {
    console.warn('⚠️ useTierAccess: Failed to cache tier:', error);
  }
}

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

  // Function to fetch user tier (extracted for reuse)
  const fetchUserTier = async () => {
      const startTime = Date.now();
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
        console.log('🔍 useTierAccess: Fetching tier for buyer user:', { id: user?.id, email: user?.email });

        // 1. Check cache first (instant, non-blocking)
        const cached = getCachedTier(user.id);
        if (cached) {
          setTier(cached.tier);
          setLoading(false);
          // Continue to fetch fresh tier in background, but don't block UI
          console.log('✅ useTierAccess: Using cached tier immediately, fetching fresh in background');
        }

        // Optimized query with specific field selection and timeout handling
        const queryPromise = supabase
          .from('user_buyers')
          .select('tier, id, email')  // Include additional fields for debugging
          .eq('id', user.id)
          .single();

        // Add timeout for tier lookup to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tier lookup timeout after 120 seconds')), 120000)
        );

        const { data: userBuyer, error: buyerError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]);

        console.log('🔍 useTierAccess: Raw database response:', {
          data: userBuyer,
          error: buyerError,
          hasData: !!userBuyer,
          dataKeys: userBuyer ? Object.keys(userBuyer) : [],
          tierValue: userBuyer?.tier,
          tierType: typeof userBuyer?.tier
        });

        if (buyerError && buyerError.code !== 'PGRST116') {
          console.error('❌ Error fetching user tier:', {
            message: buyerError.message,
            code: buyerError.code,
            details: buyerError.details,
            hint: buyerError.hint
          });
          setTier('basic'); // Default to basic instead of null
          return;
        }

        // Handle case where user is not found in user_buyers table
        if (buyerError && buyerError.code === 'PGRST116') {
          console.warn('⚠️ User not found in user_buyers table, defaulting to basic tier');
          setTier('basic');
          return;
        }

        const userTier = userBuyer?.tier as UserTier;
        console.log('🔍 useTierAccess: Database tier result:', {
          tier: userTier,
          id: user.id,
          tierIsUndefined: userTier === undefined,
          tierIsNull: userTier === null,
          actualValue: userTier
        });

        // Handle undefined/null tier values explicitly
        if (userTier === undefined || userTier === null) {
          console.warn('⚠️ Tier value is undefined/null, defaulting to basic tier');
          console.log('🔧 Setting tier to basic due to undefined/null database value');
          setTier('basic');
          setCachedTier(user.id, 'basic'); // Cache the default
          return;
        }

        // Validate tier value is one of the expected enum values
        const validTiers: UserTier[] = ['basic', 'pro', 'suite'];
        if (!validTiers.includes(userTier)) {
          console.warn('⚠️ Invalid tier value from database:', {
            tierValue: userTier,
            expectedValues: validTiers,
            userId: user.id
          });
          console.log('🔧 Setting tier to basic due to invalid database value');
          setTier('basic');
          setCachedTier(user.id, 'basic'); // Cache the default
          return;
        }

        if (userTier) {
          // If user has Pro tier, validate subscription status with grace period
          if (userTier === 'pro') {
            try {
              const { data: stripeCustomer, error: stripeError } = await supabase
                .from('stripe_customers')
                .select('subscription_status, current_period_end, updated_at')
                .eq('user_id', user.id)
                .single();

              if (stripeError && stripeError.code !== 'PGRST116') {
                console.warn('⚠️ Error checking subscription status, keeping Pro tier:', stripeError);
                // Continue with tier from database in case of error
                setTier(userTier);
              } else if (stripeCustomer) {
                console.log('🔍 useTierAccess: Subscription validation data:', {
                  subscriptionStatus: stripeCustomer.subscription_status,
                  currentPeriodEnd: stripeCustomer.current_period_end,
                  updatedAt: stripeCustomer.updated_at,
                  now: new Date().toISOString(),
                  hasSubscriptionId: !!stripeCustomer.stripe_subscription_id,
                  userId: user.id
                });

                // Handle null subscription status - treat as processing/incomplete data
                const isActive = stripeCustomer.subscription_status === 'active' ||
                                stripeCustomer.subscription_status === 'trialing';
                const isNull = stripeCustomer.subscription_status === null;
                const isCanceled = stripeCustomer.subscription_status === 'canceled' ||
                                  stripeCustomer.subscription_status === 'incomplete_expired';

                // Check if subscription period has truly expired (with 1-minute grace period)
                const gracePeriodMs = 60 * 1000; // 1 minute grace period
                const isExpired = stripeCustomer.current_period_end &&
                                 (new Date(stripeCustomer.current_period_end).getTime() + gracePeriodMs) < new Date().getTime();

                // Check if this is a very recent subscription (within last 10 minutes to allow for webhook processing)
                const isRecentSubscription = stripeCustomer.updated_at &&
                                           (new Date().getTime() - new Date(stripeCustomer.updated_at).getTime()) < (10 * 60 * 1000);

                console.log('🔍 useTierAccess: Subscription evaluation:', {
                  isActive,
                  isNull,
                  isCanceled,
                  isExpired,
                  isRecentSubscription,
                  subscriptionAge: stripeCustomer.updated_at ? `${(new Date().getTime() - new Date(stripeCustomer.updated_at).getTime()) / 1000}s` : 'unknown'
                });

                if (isActive && !isExpired) {
                  console.log('✅ Pro subscription validated:', stripeCustomer.subscription_status);
                  setTier('pro');
                  setCachedTier(user.id, 'pro'); // Cache validated pro tier
                } else if (isNull && isRecentSubscription) {
                  console.log('⏳ Recent subscription with null status - keeping Pro tier during webhook processing');
                  setTier('pro');
                  setCachedTier(user.id, 'pro'); // Cache pro tier during processing
                } else if (isNull && !isRecentSubscription) {
                  console.log('🔄 Subscription status null but not recent - keeping Pro tier (may be incomplete webhook processing)');
                  // Don't downgrade on null status - could be incomplete webhook data
                  setTier('pro');
                  setCachedTier(user.id, 'pro'); // Cache pro tier
                } else if (isCanceled && !isExpired) {
                  console.log('⏳ Canceled subscription but not expired - keeping Pro tier until period end');
                  setTier('pro');
                  setCachedTier(user.id, 'pro'); // Cache pro tier until expiry
                } else if (isCanceled && isExpired) {
                  console.warn('⚠️ Pro subscription canceled and expired, downgrading to basic:', {
                    status: stripeCustomer.subscription_status,
                    periodEnd: stripeCustomer.current_period_end
                  });
                  await supabase
                    .from('user_buyers')
                    .update({ tier: 'basic' })
                    .eq('id', user.id);
                  setTier('basic');
                } else if (isExpired) {
                  console.warn('⚠️ Pro subscription expired, downgrading to basic:', {
                    periodEnd: stripeCustomer.current_period_end,
                    now: new Date().toISOString()
                  });
                  await supabase
                    .from('user_buyers')
                    .update({ tier: 'basic' })
                    .eq('id', user.id);
                  setTier('basic');
                  setCachedTier(user.id, 'basic'); // Cache downgraded tier
                } else {
                  console.log('✅ Pro tier conditions unclear, keeping Pro tier (conservative approach)');
                  setTier('pro');
                  setCachedTier(user.id, 'pro'); // Cache pro tier (conservative)
                }
              } else {
                console.warn('⚠️ No subscription record found for Pro user');
                // For Pro users without subscription records, keep Pro tier for now
                // This handles cases where webhook hasn't processed yet
                console.log('ℹ️ Keeping Pro tier - subscription record may be processing');
                setTier('pro');
                setCachedTier(user.id, 'pro'); // Cache pro tier during processing
              }
            } catch (subscriptionError) {
              console.warn('⚠️ Subscription validation error, keeping Pro tier:', subscriptionError);
              // Continue with tier from database in case of subscription check failure
              setTier(userTier);
              setCachedTier(user.id, userTier); // Cache tier from database
            }
          } else {
            console.log('✅ Setting tier to:', userTier);
            setTier(userTier);
            setCachedTier(user.id, userTier); // Cache successful tier fetch
          }
        } else {
          console.warn('⚠️ No tier found for user, defaulting to basic');
          setTier('basic');
          setCachedTier(user.id, 'basic'); // Cache default tier
        }

        // Log performance metrics for production monitoring
        const duration = Date.now() - startTime;
        if (duration > 3000) {
          console.warn('🐌 TIER ACCESS MONITOR: Slow tier lookup detected', {
            userId: user.id,
            duration: `${duration}ms`,
            operation: 'fetchUserTier'
          });
        }

      } catch (error) {
        console.error('❌ Exception fetching user tier:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });

        // Try to use cached tier if available
        const cached = getCachedTier(user.id);
        if (cached) {
          console.log('✅ Using stale cached tier after error:', cached.tier);
          setTier(cached.tier);
        } else {
          // Handle timeout specifically
          if (error.message?.includes('timeout')) {
            console.warn('⏰ Tier lookup timed out, defaulting to basic tier');
            setTier('basic');
            setCachedTier(user.id, 'basic'); // Cache fallback
          } else {
            console.warn('🔧 Database error during tier lookup, defaulting to basic tier');
            setTier('basic'); // Default to basic instead of null for better UX
            setCachedTier(user.id, 'basic'); // Cache fallback
          }
        }
      } finally {
        setLoading(false);
      }
    };

  // Force refresh tier data
  const refreshTier = async () => {
    setLoading(true);
    await fetchUserTier();
  };

  // Initial load
  useEffect(() => {
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
    canAccessSuiteFeatures: hasMinimumTier('suite'),
    refreshTier
  };
};
