import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Title } from '@/services/titlesService';

type FavoriteWithTitle = {
  id: string;
  user_id: string;
  title_id: string;
  created_at: string;
  titles: Title;
};

interface DataCacheState {
  titles: Title[];
  favorites: FavoriteWithTitle[];
  titleDetails: { [key: string]: Title };
  sessionId: string | null; // Track current session
  sessionStartTime: number | null; // Track session start for expiry
  lastUpdated: {
    titles?: number;
    favorites?: number;
    titleDetails?: { [key: string]: number };
  };
  dbConnectivityStatus: {
    isConnected: boolean;
    lastChecked: number;
    error?: string;
  };
}

interface DataCacheContextType {
  cache: DataCacheState;
  setTitles: (titles: Title[]) => void;
  setFavorites: (favorites: FavoriteWithTitle[]) => void;
  setTitleDetail: (titleId: string, title: Title) => void;
  getTitles: () => Title[];
  getFavorites: () => FavoriteWithTitle[];
  getTitleDetail: (titleId: string) => Title | null;
  isFresh: (key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string) => boolean;
  isSessionValid: () => boolean;
  clearCache: () => void;
  initializeSession: (sessionId: string) => void;
  setDbConnectivityStatus: (status: { isConnected: boolean; error?: string }) => void;
  getDbConnectivityStatus: () => { isConnected: boolean; lastChecked: number; error?: string };
  refreshData: (key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// Session-based cache constants
const CACHE_KEY = 'kstorybridge-session-cache';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const getEmptyCache = (): DataCacheState => ({
  titles: [],
  favorites: [],
  titleDetails: {},
  sessionId: null,
  sessionStartTime: null,
  lastUpdated: {},
  dbConnectivityStatus: {
    isConnected: true, // Default optimistic
    lastChecked: 0
  }
});

const loadFromStorage = (): DataCacheState => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Check if session is valid (within 1 hour)
      const now = Date.now();
      const sessionAge = parsed.sessionStartTime ? now - parsed.sessionStartTime : Infinity;

      if (sessionAge < SESSION_EXPIRY_MS && parsed.sessionId) {
        console.log(`📦 Loading valid session cache (${Math.round(sessionAge / (1000 * 60))} minutes old)`);
        return {
          titles: parsed.titles || [],
          favorites: parsed.favorites || [],
          titleDetails: parsed.titleDetails || {},
          sessionId: parsed.sessionId,
          sessionStartTime: parsed.sessionStartTime,
          lastUpdated: parsed.lastUpdated || {},
          dbConnectivityStatus: parsed.dbConnectivityStatus || {
            isConnected: true,
            lastChecked: 0
          }
        };
      } else {
        console.log('🕒 Session cache expired or invalid, clearing...');
        localStorage.removeItem(CACHE_KEY);
      }
    }
  } catch (error) {
    console.warn('❌ Failed to load cache from localStorage:', error);
    localStorage.removeItem(CACHE_KEY);
  }

  return getEmptyCache();
};

const saveToStorage = (cache: DataCacheState) => {
  // Only save cache if we have a valid session
  if (!cache.sessionId || !cache.sessionStartTime) {
    return;
  }

  // Check session expiry before saving
  const sessionAge = Date.now() - cache.sessionStartTime;
  if (sessionAge >= SESSION_EXPIRY_MS) {
    console.log('🕒 Session expired, not saving cache');
    localStorage.removeItem(CACHE_KEY);
    return;
  }

  try {
    // Limit stored data to prevent localStorage bloat
    const MAX_TITLES_TO_CACHE = 30;
    const limitedCache = {
      ...cache,
      titles: cache.titles.slice(0, MAX_TITLES_TO_CACHE),
      favorites: cache.favorites,
      titleDetails: cache.titleDetails,
      sessionId: cache.sessionId,
      sessionStartTime: cache.sessionStartTime,
      lastUpdated: cache.lastUpdated,
      dbConnectivityStatus: cache.dbConnectivityStatus
    };

    const serialized = JSON.stringify(limitedCache);
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);

    // Session cache size limit
    if (sizeInMB > 0.5) { // 0.5MB limit
      console.warn(`📦 Session cache size too large (${sizeInMB.toFixed(2)}MB), clearing...`);
      localStorage.removeItem(CACHE_KEY);
      return;
    }

    localStorage.setItem(CACHE_KEY, serialized);
  } catch (error) {
    console.warn('❌ Failed to save session cache:', error);
    if ((error as any).name === 'QuotaExceededError') {
      localStorage.removeItem(CACHE_KEY);
    }
  }
};

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<DataCacheState>(() => loadFromStorage());
  const isFirstRender = useRef(true);

  // Save to localStorage whenever cache changes (but skip initial load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToStorage(cache);
  }, [cache]);

  // Auto-expire session and clear cache after 1 hour of inactivity
  useEffect(() => {
    if (!cache.sessionStartTime) return;

    const checkSessionExpiry = () => {
      const sessionAge = Date.now() - cache.sessionStartTime!;
      if (sessionAge >= SESSION_EXPIRY_MS) {
        console.log('🕒 Session expired due to inactivity, clearing cache...');
        setCache(getEmptyCache());
        localStorage.removeItem(CACHE_KEY);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cache.sessionStartTime]);

  const setTitles = useCallback((titles: Title[]) => {
    setCache(prev => ({
      ...prev,
      titles,
      lastUpdated: { ...prev.lastUpdated, titles: Date.now() }
    }));
  }, []);

  const setFavorites = useCallback((favorites: FavoriteWithTitle[]) => {
    setCache(prev => ({
      ...prev,
      favorites,
      lastUpdated: { ...prev.lastUpdated, favorites: Date.now() }
    }));
  }, []);

  const setTitleDetail = useCallback((titleId: string, title: Title) => {
    setCache(prev => ({
      ...prev,
      titleDetails: { ...prev.titleDetails, [titleId]: title },
      lastUpdated: {
        ...prev.lastUpdated,
        titleDetails: {
          ...prev.lastUpdated.titleDetails,
          [titleId]: Date.now()
        }
      }
    }));
  }, []);

  const getTitles = useCallback(() => cache.titles, [cache.titles]);
  const getFavorites = useCallback(() => cache.favorites, [cache.favorites]);
  const getTitleDetail = useCallback((titleId: string) => cache.titleDetails[titleId] || null, [cache.titleDetails]);

  const isFresh = useCallback((key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string, maxAge = SESSION_EXPIRY_MS) => {
    // Check session validity first
    if (!cache.sessionId || !cache.sessionStartTime) {
      return false; // No valid session
    }

    const sessionAge = Date.now() - cache.sessionStartTime;
    if (sessionAge >= SESSION_EXPIRY_MS) {
      return false; // Session expired
    }

    // Handle titleDetails separately since it's an object
    if (key.startsWith('titleDetail:')) {
      const titleId = key.split(':')[1];
      const timestamp = cache.lastUpdated.titleDetails?.[titleId];
      if (!timestamp) return false;
      return Date.now() - timestamp < maxAge;
    }

    const timestamp = cache.lastUpdated[key as keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'>];
    if (!timestamp) return false;
    return Date.now() - timestamp < maxAge;
  }, [cache.lastUpdated, cache.sessionId, cache.sessionStartTime]);

  const isSessionValid = useCallback(() => {
    if (!cache.sessionId || !cache.sessionStartTime) {
      return false;
    }
    const sessionAge = Date.now() - cache.sessionStartTime;
    return sessionAge < SESSION_EXPIRY_MS;
  }, [cache.sessionId, cache.sessionStartTime]);

  const initializeSession = useCallback((sessionId: string) => {
    console.log('🚀 Initializing new session cache:', sessionId.substring(0, 8) + '...');
    setCache(prev => ({
      ...getEmptyCache(),
      sessionId,
      sessionStartTime: Date.now(),
      dbConnectivityStatus: prev.dbConnectivityStatus
    }));
  }, []);

  const setDbConnectivityStatus = useCallback((status: { isConnected: boolean; error?: string }) => {
    setCache(prev => ({
      ...prev,
      dbConnectivityStatus: {
        ...status,
        lastChecked: Date.now()
      }
    }));
  }, []);

  const getDbConnectivityStatus = useCallback(() => cache.dbConnectivityStatus, [cache.dbConnectivityStatus]);

  const clearCache = useCallback(() => {
    console.log('🧼 Clearing all cache data...');
    setCache(getEmptyCache());
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const refreshData = useCallback((key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string) => {
    if (key.startsWith('titleDetail:')) {
      const titleId = key.split(':')[1];
      setCache(prev => {
        const newTitleDetails = { ...prev.lastUpdated.titleDetails };
        delete newTitleDetails[titleId];
        return {
          ...prev,
          lastUpdated: {
            ...prev.lastUpdated,
            titleDetails: newTitleDetails
          }
        };
      });
    } else {
      setCache(prev => {
        const newLastUpdated = { ...prev.lastUpdated };
        delete (newLastUpdated as any)[key];
        return {
          ...prev,
          lastUpdated: newLastUpdated
        };
      });
    }
  }, []);

  const value: DataCacheContextType = {
    cache,
    setTitles,
    setFavorites,
    setTitleDetail,
    getTitles,
    getFavorites,
    getTitleDetail,
    isFresh,
    isSessionValid,
    clearCache,
    initializeSession,
    setDbConnectivityStatus,
    getDbConnectivityStatus,
    refreshData
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}
