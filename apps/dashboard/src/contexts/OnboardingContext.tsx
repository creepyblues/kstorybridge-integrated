import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingState {
  isLoading: boolean;
  shouldShow: boolean;
  hasChecked: boolean;
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  markCompleted: () => void;
  markSkipped: () => void;
  forceCheck: () => Promise<void>;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * OnboardingProvider - Efficient onboarding state management with caching
 *
 * Optimization Features:
 * - Session storage caching (skip DB queries for returning users)
 * - Single check per session (not per navigation)
 * - Non-blocking initialization
 * - Graceful fallback on errors
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isLoading: false,
    shouldShow: false,
    hasChecked: false
  });

  /**
   * Get cache key for current user
   */
  const getCacheKey = (userId: string) => `onboarding_status_${userId}`;

  /**
   * Check session storage cache first
   */
  const getCachedStatus = (userId: string): boolean | null => {
    try {
      const cached = sessionStorage.getItem(getCacheKey(userId));
      if (cached !== null) {
        const isCompleted = cached === 'completed' || cached === 'skipped';
        console.log('✅ ONBOARDING: Found cached status:', { userId, status: cached, shouldShow: !isCompleted });
        return !isCompleted; // Return shouldShow (inverse of completed)
      }
    } catch (error) {
      console.warn('⚠️ ONBOARDING: Failed to read cache:', error);
    }
    return null;
  };

  /**
   * Cache onboarding status in session storage
   */
  const setCachedStatus = (userId: string, status: 'completed' | 'skipped' | 'pending') => {
    try {
      sessionStorage.setItem(getCacheKey(userId), status);
      console.log('💾 ONBOARDING: Cached status:', { userId, status });
    } catch (error) {
      console.warn('⚠️ ONBOARDING: Failed to cache status:', error);
    }
  };

  /**
   * Simplified database check (no retry logic)
   */
  const checkDatabaseStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔍 ONBOARDING: Checking database status for user:', userId);

      // Import here to avoid circular dependencies
      const { OnboardingService } = await import('@/services/onboardingService');
      const shouldShow = await OnboardingService.shouldShowOnboarding(userId);

      // Cache the result
      const cacheStatus = shouldShow ? 'pending' : 'completed';
      setCachedStatus(userId, cacheStatus);

      console.log('📊 ONBOARDING: Database check result:', { userId, shouldShow, cached: cacheStatus });
      return shouldShow;
    } catch (error) {
      console.warn('⚠️ ONBOARDING: Database check failed, assuming no onboarding needed:', error);
      // Graceful fallback: assume user doesn't need onboarding
      setCachedStatus(userId, 'completed');
      return false;
    }
  };

  /**
   * Main onboarding check with caching
   */
  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    // First check cache
    const cachedResult = getCachedStatus(userId);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Cache miss - check database
    return await checkDatabaseStatus(userId);
  };

  /**
   * Initialize onboarding check for user
   */
  const initializeOnboarding = async (userId: string) => {
    if (onboardingState.hasChecked) {
      console.log('🔄 ONBOARDING: Already checked for this session, skipping');
      return;
    }

    setOnboardingState(prev => ({ ...prev, isLoading: true }));

    try {
      const shouldShow = await checkOnboardingStatus(userId);

      setOnboardingState({
        isLoading: false,
        shouldShow,
        hasChecked: true
      });

      console.log('✅ ONBOARDING: Initialization complete:', { userId, shouldShow });
    } catch (error) {
      console.error('❌ ONBOARDING: Initialization failed:', error);

      // Graceful fallback
      setOnboardingState({
        isLoading: false,
        shouldShow: false,
        hasChecked: true
      });
    }
  };

  /**
   * Mark onboarding as completed
   */
  const markCompleted = () => {
    if (!user) return;

    console.log('✅ ONBOARDING: Marking as completed for user:', user.id);
    setCachedStatus(user.id, 'completed');
    setOnboardingState(prev => ({ ...prev, shouldShow: false }));
  };

  /**
   * Mark onboarding as skipped
   */
  const markSkipped = () => {
    if (!user) return;

    console.log('⏭️ ONBOARDING: Marking as skipped for user:', user.id);
    setCachedStatus(user.id, 'skipped');
    setOnboardingState(prev => ({ ...prev, shouldShow: false }));
  };

  /**
   * Force a fresh check (bypass cache)
   */
  const forceCheck = async () => {
    if (!user) return;

    console.log('🔄 ONBOARDING: Forcing fresh check for user:', user.id);

    // Clear cache
    try {
      sessionStorage.removeItem(getCacheKey(user.id));
    } catch (error) {
      console.warn('⚠️ ONBOARDING: Failed to clear cache:', error);
    }

    // Reset state and check again
    setOnboardingState({ isLoading: false, shouldShow: false, hasChecked: false });
    await initializeOnboarding(user.id);
  };

  /**
   * Reset onboarding state (for logout)
   */
  const reset = () => {
    console.log('🔄 ONBOARDING: Resetting state');
    setOnboardingState({
      isLoading: false,
      shouldShow: false,
      hasChecked: false
    });
  };

  /**
   * Initialize when user changes
   */
  useEffect(() => {
    if (user?.id) {
      console.log('👤 ONBOARDING: User detected, initializing:', user.id);
      initializeOnboarding(user.id);
    } else {
      console.log('🚪 ONBOARDING: No user, resetting state');
      reset();
    }
  }, [user?.id]);

  /**
   * Cleanup cache on unmount (session end)
   */
  useEffect(() => {
    return () => {
      if (user?.id) {
        try {
          // Keep cache on normal navigation, only clear on app close
          // sessionStorage persists until tab closes
        } catch (error) {
          console.warn('⚠️ ONBOARDING: Cleanup failed:', error);
        }
      }
    };
  }, [user?.id]);

  const contextValue: OnboardingContextType = {
    onboardingState,
    markCompleted,
    markSkipped,
    forceCheck,
    reset
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to use onboarding context
 */
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

/**
 * Export types for external use
 */
export type { OnboardingState, OnboardingContextType };