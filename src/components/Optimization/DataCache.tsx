import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheState {
  entries: Map<string, CacheEntry>;
  maxSize: number;
  defaultTTL: number;
}

type CacheAction = 
  | { type: 'SET'; payload: { key: string; data: any; ttl?: number } }
  | { type: 'DELETE'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'CLEANUP' };

const initialState: CacheState = {
  entries: new Map(),
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
};

function cacheReducer(state: CacheState, action: CacheAction): CacheState {
  switch (action.type) {
    case 'SET': {
      const { key, data, ttl = state.defaultTTL } = action.payload;
      const newEntries = new Map(state.entries);
      
      // Remove oldest entries if cache is full
      if (newEntries.size >= state.maxSize && !newEntries.has(key)) {
        const oldestKey = Array.from(newEntries.keys())[0];
        newEntries.delete(oldestKey);
      }
      
      const now = Date.now();
      newEntries.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        key,
      });
      
      return { ...state, entries: newEntries };
    }
    
    case 'DELETE': {
      const newEntries = new Map(state.entries);
      newEntries.delete(action.payload);
      return { ...state, entries: newEntries };
    }
    
    case 'CLEAR': {
      return { ...state, entries: new Map() };
    }
    
    case 'CLEANUP': {
      const now = Date.now();
      const newEntries = new Map();
      
      for (const [key, entry] of state.entries) {
        if (entry.expiresAt > now) {
          newEntries.set(key, entry);
        }
      }
      
      return { ...state, entries: newEntries };
    }
    
    default:
      return state;
  }
}

interface DataCacheContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
  getStats: () => {
    size: number;
    hitRate: number;
    maxSize: number;
  };
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cacheReducer, initialState);
  const hits = React.useRef(0);
  const misses = React.useRef(0);

  // Cleanup expired entries periodically
  React.useEffect(() => {
    const cleanup = () => dispatch({ type: 'CLEANUP' });
    const interval = setInterval(cleanup, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = state.entries.get(key);
    
    if (!entry) {
      misses.current++;
      return null;
    }
    
    if (entry.expiresAt <= Date.now()) {
      dispatch({ type: 'DELETE', payload: key });
      misses.current++;
      return null;
    }
    
    hits.current++;
    return entry.data as T;
  }, [state.entries]);

  const set = useCallback(<T,>(key: string, data: T, ttl?: number) => {
    dispatch({ type: 'SET', payload: { key, data, ttl } });
  }, []);

  const remove = useCallback((key: string) => {
    dispatch({ type: 'DELETE', payload: key });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    hits.current = 0;
    misses.current = 0;
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = state.entries.get(key);
    return entry ? entry.expiresAt > Date.now() : false;
  }, [state.entries]);

  const getStats = useCallback(() => {
    const total = hits.current + misses.current;
    return {
      size: state.entries.size,
      hitRate: total > 0 ? hits.current / total : 0,
      maxSize: state.maxSize,
    };
  }, [state.entries.size, state.maxSize]);

  const value: DataCacheContextType = {
    get,
    set,
    remove,
    clear,
    has,
    getStats,
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

// Higher-order component for caching data fetching
export function withDataCache<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  cacheKey: string | ((props: T) => string),
  ttl?: number
) {
  return function CachedComponent(props: T) {
    const cache = useDataCache();
    const key = typeof cacheKey === 'string' ? cacheKey : cacheKey(props);
    
    const cachedData = cache.get(key);
    
    return (
      <Component
        {...props}
        _cacheKey={key}
        _cachedData={cachedData}
        _setCache={(data: any) => cache.set(key, data, ttl)}
      />
    );
  };
}