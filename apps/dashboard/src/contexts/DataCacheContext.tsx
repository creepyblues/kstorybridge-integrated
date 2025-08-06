import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Title } from '@/services/titlesService';
import { FeaturedWithTitle } from '@/services/featuredService';

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
  lastUpdated: {
    titles?: number;
    featuredTitles?: number;
    creatorTitles?: number;
    favorites?: number;
  };
}

interface DataCacheContextType {
  cache: DataCacheState;
  setTitles: (titles: Title[]) => void;
  setFeaturedTitles: (featured: FeaturedWithTitle[]) => void;
  setCreatorTitles: (titles: Title[]) => void;
  setFavorites: (favorites: FavoriteWithTitle[]) => void;
  getTitles: () => Title[];
  getFeaturedTitles: () => FeaturedWithTitle[];
  getCreatorTitles: () => Title[];
  getFavorites: () => FavoriteWithTitle[];
  isFresh: (key: keyof DataCacheState['lastUpdated'], maxAge?: number) => boolean;
  clearCache: () => void;
  refreshData: (key: keyof DataCacheState['lastUpdated']) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<DataCacheState>({
    titles: [],
    featuredTitles: [],
    creatorTitles: [],
    favorites: [],
    lastUpdated: {}
  });

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

  const getTitles = useCallback(() => cache.titles, [cache.titles]);
  const getFeaturedTitles = useCallback(() => cache.featuredTitles, [cache.featuredTitles]);
  const getCreatorTitles = useCallback(() => cache.creatorTitles, [cache.creatorTitles]);
  const getFavorites = useCallback(() => cache.favorites, [cache.favorites]);

  const isFresh = useCallback((key: keyof DataCacheState['lastUpdated'], maxAge = 5 * 60 * 1000) => {
    const timestamp = cache.lastUpdated[key];
    if (!timestamp) return false;
    return Date.now() - timestamp < maxAge;
  }, [cache.lastUpdated]);

  const clearCache = useCallback(() => {
    setCache({
      titles: [],
      featuredTitles: [],
      creatorTitles: [],
      favorites: [],
      lastUpdated: {}
    });
  }, []);

  const refreshData = useCallback((key: keyof DataCacheState['lastUpdated']) => {
    setCache(prev => ({
      ...prev,
      lastUpdated: { ...prev.lastUpdated, [key]: undefined }
    }));
  }, []);

  const value: DataCacheContextType = {
    cache,
    setTitles,
    setFeaturedTitles,
    setCreatorTitles,
    setFavorites,
    getTitles,
    getFeaturedTitles,
    getCreatorTitles,
    getFavorites,
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