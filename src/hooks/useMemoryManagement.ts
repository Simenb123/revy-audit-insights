import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

interface MemoryManagerOptions {
  warningThreshold?: number; // Percentage
  criticalThreshold?: number; // Percentage
  cleanupInterval?: number; // ms
  onWarning?: (usage: MemoryUsage) => void;
  onCritical?: (usage: MemoryUsage) => void;
  enableAutoCleanup?: boolean;
}

export function useMemoryManagement(options: MemoryManagerOptions = {}) {
  const {
    warningThreshold = 70,
    criticalThreshold = 85,
    cleanupInterval = 30000, // 30 seconds
    onWarning,
    onCritical,
    enableAutoCleanup = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastWarningRef = useRef<number>(0);
  const lastCriticalRef = useRef<number>(0);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  const getMemoryUsage = useCallback((): MemoryUsage | null => {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
    };
  }, []);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const triggerGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        logger.debug('Manual garbage collection triggered');
      } catch (error) {
        logger.warn('Failed to trigger garbage collection:', error);
      }
    }
  }, []);

  const executeCleanup = useCallback(() => {
    logger.debug('Executing memory cleanup functions');
    
    cleanupFunctionsRef.current.forEach((cleanup, index) => {
      try {
        cleanup();
      } catch (error) {
        logger.error(`Cleanup function ${index} failed:`, error);
      }
    });

    // Trigger garbage collection if available
    triggerGarbageCollection();
    
    // Clear large objects from memory
    if (global.gc) {
      global.gc();
    }
  }, [triggerGarbageCollection]);

  const checkMemoryUsage = useCallback(() => {
    const usage = getMemoryUsage();
    if (!usage) return;

    const now = Date.now();
    
    logger.debug('Memory usage:', {
      used: formatBytes(usage.usedJSHeapSize),
      total: formatBytes(usage.totalJSHeapSize),
      limit: formatBytes(usage.jsHeapSizeLimit),
      percentage: `${usage.usagePercentage.toFixed(1)}%`,
    });

    // Warning threshold
    if (usage.usagePercentage >= warningThreshold && now - lastWarningRef.current > 60000) {
      logger.warn(`Memory usage warning: ${usage.usagePercentage.toFixed(1)}%`);
      lastWarningRef.current = now;
      onWarning?.(usage);
    }

    // Critical threshold
    if (usage.usagePercentage >= criticalThreshold && now - lastCriticalRef.current > 60000) {
      logger.error(`Critical memory usage: ${usage.usagePercentage.toFixed(1)}%`);
      lastCriticalRef.current = now;
      onCritical?.(usage);
      
      if (enableAutoCleanup) {
        executeCleanup();
      }
    }
  }, [
    getMemoryUsage,
    formatBytes,
    warningThreshold,
    criticalThreshold,
    onWarning,
    onCritical,
    enableAutoCleanup,
    executeCleanup,
  ]);

  const registerCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
    
    // Return unregister function
    return () => {
      const index = cleanupFunctionsRef.current.indexOf(cleanup);
      if (index > -1) {
        cleanupFunctionsRef.current.splice(index, 1);
      }
    };
  }, []);

  const forceCleanup = useCallback(() => {
    executeCleanup();
  }, [executeCleanup]);

  const getMemoryInfo = useCallback(() => {
    const usage = getMemoryUsage();
    if (!usage) {
      return { available: false };
    }

    return {
      available: true,
      used: formatBytes(usage.usedJSHeapSize),
      total: formatBytes(usage.totalJSHeapSize),
      limit: formatBytes(usage.jsHeapSizeLimit),
      percentage: usage.usagePercentage.toFixed(1) + '%',
      raw: usage,
    };
  }, [getMemoryUsage, formatBytes]);

  // Start monitoring
  useEffect(() => {
    intervalRef.current = setInterval(checkMemoryUsage, cleanupInterval);
    
    // Initial check
    checkMemoryUsage();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkMemoryUsage, cleanupInterval]);

  return {
    getMemoryUsage,
    getMemoryInfo,
    registerCleanupFunction,
    forceCleanup,
    triggerGarbageCollection,
  };
}

// Specialized hook for widget memory management
export function useWidgetMemoryManagement(widgetId: string) {
  const { registerCleanupFunction, getMemoryInfo } = useMemoryManagement({
    warningThreshold: 75,
    criticalThreshold: 90,
    enableAutoCleanup: true,
  });

  const widgetCacheRef = useRef<Map<string, any>>(new Map());
  const eventListenersRef = useRef<Array<() => void>>([]);

  const addToCache = useCallback((key: string, data: any) => {
    widgetCacheRef.current.set(key, data);
  }, []);

  const removeFromCache = useCallback((key: string) => {
    widgetCacheRef.current.delete(key);
  }, []);

  const clearCache = useCallback(() => {
    widgetCacheRef.current.clear();
    logger.debug(`Widget ${widgetId} cache cleared`);
  }, [widgetId]);

  const addEventListenerCleanup = useCallback((cleanup: () => void) => {
    eventListenersRef.current.push(cleanup);
  }, []);

  const cleanupEventListeners = useCallback(() => {
    eventListenersRef.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.error(`Event listener cleanup failed for widget ${widgetId}:`, error);
      }
    });
    eventListenersRef.current = [];
    logger.debug(`Widget ${widgetId} event listeners cleaned up`);
  }, [widgetId]);

  // Register cleanup functions
  useEffect(() => {
    const unregisterCache = registerCleanupFunction(clearCache);
    const unregisterEvents = registerCleanupFunction(cleanupEventListeners);

    return () => {
      unregisterCache();
      unregisterEvents();
      clearCache();
      cleanupEventListeners();
    };
  }, [registerCleanupFunction, clearCache, cleanupEventListeners]);

  return {
    addToCache,
    removeFromCache,
    clearCache,
    addEventListenerCleanup,
    cleanupEventListeners,
    getMemoryInfo,
  };
}