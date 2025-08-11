import React, { createContext, useContext, ReactNode } from 'react';
import { useTierAccess } from '@/hooks/useTierAccess';

type UserTier = 'invited' | 'basic' | 'pro' | 'suite';

interface TierContextType {
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

const TierContext = createContext<TierContextType | undefined>(undefined);

/**
 * TierProvider - Provides tier information to all child components
 * This prevents multiple database queries by fetching user tier once
 * at the page level and sharing it throughout the component tree.
 */
export function TierProvider({ children }: { children: ReactNode }) {
  const tierAccess = useTierAccess();

  return (
    <TierContext.Provider value={tierAccess}>
      {children}
    </TierContext.Provider>
  );
}

/**
 * useTier - Hook to access tier information from context
 * Use this instead of useTierAccess() in components to avoid
 * multiple database queries.
 */
export function useTier(): TierContextType {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}