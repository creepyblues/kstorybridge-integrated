import { useTier } from '@/contexts/TierContext';

type UserTier = 'invited' | 'basic' | 'pro' | 'suite';

/**
 * useOptimizedTierAccess - Optimized hook for tier access
 * 
 * This hook gets tier information from TierContext instead of making
 * database queries. Use this in components that need tier information
 * when the page is wrapped with TierProvider.
 * 
 * Benefits:
 * - Single database query per page load
 * - Shared tier state across all components
 * - Faster rendering and better performance
 * 
 * Usage:
 * const { isPro, canAccessPremiumContent } = useOptimizedTierAccess();
 */
export const useOptimizedTierAccess = () => {
  return useTier();
};

/**
 * Utility function to check if user has minimum tier
 * Can be used for conditional rendering without hooks
 */
export const checkMinimumTier = (userTier: UserTier | null, requiredTier: UserTier): boolean => {
  if (!userTier) return false;
  
  const tierHierarchy: Record<UserTier, number> = {
    invited: 0,
    basic: 1,
    pro: 2,
    suite: 3
  };
  
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
};