import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Title } from '@/services/titlesService';
import { FeaturedWithTitle } from '@/services/featuredService';
import { RequestWithTitle } from '@/services/requestsService';

type FavoriteWithTitle = {
  id: string;
  user_id: string;
  title_id: string;
  created_at: string;
  titles: Title;
};

interface DataCacheState {
  titles: Title[];
  featuredTitles: FeaturedWithTitle[];
  creatorTitles: Title[];
  favorites: FavoriteWithTitle[];
  titleDetails: { [key: string]: Title };
  myRequests: RequestWithTitle[];
  lastUpdated: {
    titles?: number;
    featuredTitles?: number;
    creatorTitles?: number;
    favorites?: number;
    titleDetails?: { [key: string]: number };
    myRequests?: number;
  };
}

interface DataCacheContextType {
  cache: DataCacheState;
  setTitles: (titles: Title[]) => void;
  setFeaturedTitles: (featured: FeaturedWithTitle[]) => void;
  setCreatorTitles: (titles: Title[]) => void;
  setFavorites: (favorites: FavoriteWithTitle[]) => void;
  setTitleDetail: (titleId: string, title: Title) => void;
  setMyRequests: (requests: RequestWithTitle[]) => void;
  getTitles: () => Title[];
  getFeaturedTitles: () => FeaturedWithTitle[];
  getCreatorTitles: () => Title[];
  getFavorites: () => FavoriteWithTitle[];
  getTitleDetail: (titleId: string) => Title | null;
  getMyRequests: () => RequestWithTitle[];
  isFresh: (key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string, maxAge?: number) => boolean;
  clearCache: () => void;
  refreshData: (key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// Helper functions for localStorage
const CACHE_KEY = 'kstorybridge-cache';

const loadFromStorage = (): DataCacheState => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        titles: parsed.titles || [],
        featuredTitles: parsed.featuredTitles || [],
        creatorTitles: parsed.creatorTitles || [],
        favorites: parsed.favorites || [],
        titleDetails: parsed.titleDetails || {},
        myRequests: parsed.myRequests || [],
        lastUpdated: parsed.lastUpdated || {}
      };
    }
  } catch (error) {
    console.warn('Failed to load cache from localStorage:', error);
  }
  
  return {
    titles: [],
    featuredTitles: [],
    creatorTitles: [],
    favorites: [],
    titleDetails: {},
    myRequests: [],
    lastUpdated: {}
  };
};

const saveToStorage = (cache: DataCacheState) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save cache to localStorage:', error);
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

  const setTitles = useCallback((titles: Title[]) => {
    setCache(prev => ({
      ...prev,
      titles,
      lastUpdated: { ...prev.lastUpdated, titles: Date.now() }
    }));
  }, []);

  const setFeaturedTitles = useCallback((featuredTitles: FeaturedWithTitle[]) => {
    setCache(prev => ({
      ...prev,
      featuredTitles,
      lastUpdated: { ...prev.lastUpdated, featuredTitles: Date.now() }
    }));
  }, []);

  const setCreatorTitles = useCallback((creatorTitles: Title[]) => {
    setCache(prev => ({
      ...prev,
      creatorTitles,
      lastUpdated: { ...prev.lastUpdated, creatorTitles: Date.now() }
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

  const setMyRequests = useCallback((myRequests: RequestWithTitle[]) => {
    setCache(prev => ({
      ...prev,
      myRequests,
      lastUpdated: { ...prev.lastUpdated, myRequests: Date.now() }
    }));
  }, []);

  const getTitles = useCallback(() => cache.titles, [cache.titles]);
  const getFeaturedTitles = useCallback(() => cache.featuredTitles, [cache.featuredTitles]);
  const getCreatorTitles = useCallback(() => cache.creatorTitles, [cache.creatorTitles]);
  const getFavorites = useCallback(() => cache.favorites, [cache.favorites]);
  const getTitleDetail = useCallback((titleId: string) => cache.titleDetails[titleId] || null, [cache.titleDetails]);
  const getMyRequests = useCallback(() => cache.myRequests, [cache.myRequests]);

  const isFresh = useCallback((key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string, maxAge = 24 * 60 * 60 * 1000) => {
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
  }, [cache.lastUpdated]);

  const clearCache = useCallback(() => {
    const emptyCache = {
      titles: [],
      featuredTitles: [],
      creatorTitles: [],
      favorites: [],
      titleDetails: {},
      myRequests: [],
      lastUpdated: {}
    };
    setCache(emptyCache);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const refreshData = useCallback((key: keyof Omit<DataCacheState['lastUpdated'], 'titleDetails'> | string) => {
    if (key.startsWith('titleDetail:')) {
      const titleId = key.split(':')[1];
      setCache(prev => ({
        ...prev,
        lastUpdated: { 
          ...prev.lastUpdated, 
          titleDetails: {
            ...prev.lastUpdated.titleDetails,
            [titleId]: undefined
          }
        }
      }));
    } else {
      setCache(prev => ({
        ...prev,
        lastUpdated: { ...prev.lastUpdated, [key]: undefined }
      }));
    }
  }, []);

  const value: DataCacheContextType = {
    cache,
    setTitles,
    setFeaturedTitles,
    setCreatorTitles,
    setFavorites,
    setTitleDetail,
    setMyRequests,
    getTitles,
    getFeaturedTitles,
    getCreatorTitles,
    getFavorites,
    getTitleDetail,
    getMyRequests,
    isFresh,
    clearCache,
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