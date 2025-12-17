import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Trial mode state management for anonymous users
// Tracks search usage in localStorage, limits to 5 AI searches

const STORAGE_KEY = 'kstorybridge_trial_usage';
const MAX_TRIALS = 5;

interface TrialStorage {
  searches_used: number;
  version: 1;
}

interface TrialContextType {
  remainingTrials: number;
  hasTrialRemaining: boolean;
  incrementUsage: () => void;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  maxTrials: number;
}

const TrialContext = createContext<TrialContextType | undefined>(undefined);

function getStoredUsage(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;

    const parsed: TrialStorage = JSON.parse(stored);
    if (parsed.version !== 1) return 0;

    return parsed.searches_used || 0;
  } catch {
    return 0;
  }
}

function setStoredUsage(count: number): void {
  try {
    const data: TrialStorage = {
      searches_used: count,
      version: 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[TrialContext] Failed to save usage to localStorage');
  }
}

export function TrialProvider({ children }: { children: ReactNode }) {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getStoredUsage();
    setUsageCount(stored);
  }, []);

  const incrementUsage = useCallback(() => {
    setUsageCount((prev) => {
      const newCount = prev + 1;
      setStoredUsage(newCount);

      // Show modal if this was the last trial
      if (newCount >= MAX_TRIALS) {
        setShowLimitModal(true);
      }

      return newCount;
    });
  }, []);

  const remainingTrials = Math.max(0, MAX_TRIALS - usageCount);
  const hasTrialRemaining = remainingTrials > 0;

  return (
    <TrialContext.Provider
      value={{
        remainingTrials,
        hasTrialRemaining,
        incrementUsage,
        showLimitModal,
        setShowLimitModal,
        maxTrials: MAX_TRIALS,
      }}
    >
      {children}
    </TrialContext.Provider>
  );
}

export function useTrial() {
  const context = useContext(TrialContext);
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider');
  }
  return context;
}
