import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

// Trial mode state management for anonymous users
// Tracks search usage in localStorage with session_id for backend tracking
// Limits to 5 AI searches

const STORAGE_KEY = 'kstorybridge_trial_usage';
const MAX_TRIALS = 5;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Storage schema v2 with session tracking
interface TrialStorage {
  session_id: string;
  searches_used: number;
  tools_used: string[];
  last_comps_query: string[] | null;
  last_mandate_query: string | null;
  last_chat_query: string | null;
  first_visit_at: string;
  version: 2;
}

// Legacy v1 schema for migration
interface TrialStorageV1 {
  searches_used: number;
  version: 1;
}

interface TrialContextType {
  remainingTrials: number;
  hasTrialRemaining: boolean;
  incrementUsage: (tool: 'comps' | 'mandates' | 'chat', queryData?: QueryData) => void;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  maxTrials: number;
  sessionId: string | null;
  toolsUsed: string[];
}

interface QueryData {
  comps_query?: string[];
  mandate_query?: string;
  chat_query?: string;
}

const TrialContext = createContext<TrialContextType | undefined>(undefined);

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getStoredData(): TrialStorage | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Handle v1 migration
    if (parsed.version === 1) {
      const v1Data = parsed as TrialStorageV1;
      const migratedData: TrialStorage = {
        session_id: generateUUID(),
        searches_used: v1Data.searches_used || 0,
        tools_used: [],
        last_comps_query: null,
        last_mandate_query: null,
        last_chat_query: null,
        first_visit_at: new Date().toISOString(),
        version: 2,
      };
      // Save migrated data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
      return migratedData;
    }

    // V2 data
    if (parsed.version === 2) {
      return parsed as TrialStorage;
    }

    return null;
  } catch {
    return null;
  }
}

function initializeStorage(): TrialStorage {
  const data: TrialStorage = {
    session_id: generateUUID(),
    searches_used: 0,
    tools_used: [],
    last_comps_query: null,
    last_mandate_query: null,
    last_chat_query: null,
    first_visit_at: new Date().toISOString(),
    version: 2,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function setStoredData(data: TrialStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[TrialContext] Failed to save data to localStorage');
  }
}

// Track activity to backend (non-blocking)
async function trackActivity(
  sessionId: string,
  action: 'init' | 'search' | 'view',
  tool?: 'comps' | 'mandates' | 'chat',
  queryData?: QueryData
): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/trial-activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        action,
        tool,
        query_data: queryData,
      }),
    });

    if (!response.ok) {
      console.warn('[TrialContext] Failed to track activity:', response.status);
    }
  } catch (error) {
    // Non-blocking - don't break user experience
    console.warn('[TrialContext] Failed to track activity:', error);
  }
}

export function TrialProvider({ children }: { children: ReactNode }) {
  const [storageData, setStorageData] = useState<TrialStorage | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const initRef = useRef(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let data = getStoredData();

    if (!data) {
      data = initializeStorage();
    }

    setStorageData(data);

    // Track session init to backend (non-blocking)
    trackActivity(data.session_id, 'init');
  }, []);

  const incrementUsage = useCallback((tool: 'comps' | 'mandates' | 'chat', queryData?: QueryData) => {
    setStorageData((prev) => {
      if (!prev) return prev;

      const newToolsUsed = prev.tools_used.includes(tool)
        ? prev.tools_used
        : [...prev.tools_used, tool];

      const newData: TrialStorage = {
        ...prev,
        searches_used: prev.searches_used + 1,
        tools_used: newToolsUsed,
        last_comps_query: queryData?.comps_query || prev.last_comps_query,
        last_mandate_query: queryData?.mandate_query || prev.last_mandate_query,
        last_chat_query: queryData?.chat_query || prev.last_chat_query,
      };

      setStoredData(newData);

      // Show modal if this was the last trial
      if (newData.searches_used >= MAX_TRIALS) {
        setShowLimitModal(true);
      }

      // Track to backend (non-blocking)
      trackActivity(newData.session_id, 'search', tool, queryData);

      return newData;
    });
  }, []);

  const usageCount = storageData?.searches_used ?? 0;
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
        sessionId: storageData?.session_id ?? null,
        toolsUsed: storageData?.tools_used ?? [],
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

// Export helper for post-signup continuity: the last trial search, as a
// deep link into the matching tool with the query prefilled
export function getTrialLastSearch(): { tool: 'comps' | 'mandates' | 'chat'; label: string; path: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as TrialStorage;
    if (parsed.version !== 2) return null;

    if (parsed.last_comps_query && parsed.last_comps_query.length > 0) {
      const shows = parsed.last_comps_query;
      const showParams = shows.map((s) => `show=${encodeURIComponent(s)}`).join('&');
      return {
        tool: 'comps',
        label: shows.join(' + '),
        path: `/buyers/comps-navigator?${showParams}`,
      };
    }
    if (parsed.last_mandate_query) {
      return {
        tool: 'mandates',
        label: parsed.last_mandate_query,
        path: `/buyers/mandates?brief=${encodeURIComponent(parsed.last_mandate_query)}`,
      };
    }
    if (parsed.last_chat_query) {
      return {
        tool: 'chat',
        label: parsed.last_chat_query,
        path: `/buyers/chat?q=${encodeURIComponent(parsed.last_chat_query)}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Export helper to get session_id for signup flow
export function getTrialSessionId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (parsed.version === 2 && parsed.session_id) {
      return parsed.session_id;
    }
    return null;
  } catch {
    return null;
  }
}
