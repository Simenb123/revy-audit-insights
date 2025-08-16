import { logger } from '@/utils/logger';
import type { Widget, DashboardConfig } from '@/types/widget';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  priority: number;
  size: number;
}

interface CacheStats {
  hitCount: number;
  missCount: number;
  totalRequests: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
}

class WidgetCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(maxSize = 100 * 1024 * 1024, defaultTTL = 5 * 60 * 1000) { // 100MB, 5 minutes
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.stats = {
      hitCount: 0,
      missCount: 0,
      totalRequests: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Fallback size
    }
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
      }
      this.cache.delete(oldestKey);
      logger.debug(`Evicted cache entry: ${oldestKey}`);
    }
  }

  private enforceSize(): void {
    while (this.stats.totalSize > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.defaultTTL;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
      }
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }

    this.updateStats();
  }

  private updateStats(): void {
    this.stats.totalRequests = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hitCount / this.stats.totalRequests) * 100 
      : 0;
  }

  public get<T>(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      this.stats.missCount++;
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
        this.cache.delete(key);
      }
      this.updateStats();
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    entry.priority = entry.accessCount * 0.7 + (Date.now() - entry.timestamp) * 0.3;

    this.stats.hitCount++;
    this.updateStats();
    
    return entry.data;
  }

  public set<T>(key: string, data: T, ttl?: number): void {
    const size = this.calculateSize(data);
    const now = Date.now();

    // Remove existing entry if it exists
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.size;
      this.stats.entryCount--;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      priority: 1,
      size,
    };

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount++;

    // Enforce size limits
    this.enforceSize();
    this.updateStats();
  }

  // Widget-specific cache methods
  public getWidget(widgetId: string): Widget | null {
    return this.get<Widget>(`widget:${widgetId}`);
  }

  public setWidget(widget: Widget): void {
    this.set(`widget:${widget.id}`, widget);
  }

  public getWidgetData(widgetId: string, dataHash: string): any | null {
    return this.get(`widget-data:${widgetId}:${dataHash}`);
  }

  public setWidgetData(widgetId: string, dataHash: string, data: any): void {
    this.set(`widget-data:${widgetId}:${dataHash}`, data);
  }

  public getDashboard(dashboardId: string): DashboardConfig | null {
    return this.get<DashboardConfig>(`dashboard:${dashboardId}`);
  }

  public setDashboard(dashboard: DashboardConfig): void {
    this.set(`dashboard:${dashboard.id}`, dashboard);
  }

  public getAnalysisResult(clientId: string, year: number, analysisType: string): any | null {
    const key = this.generateKey('analysis', { clientId, year, analysisType });
    return this.get(key);
  }

  public setAnalysisResult(clientId: string, year: number, analysisType: string, result: any): void {
    const key = this.generateKey('analysis', { clientId, year, analysisType });
    this.set(key, result, 10 * 60 * 1000); // 10 minutes for analysis results
  }

  public invalidateWidget(widgetId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`widget:${widgetId}`) || key.startsWith(`widget-data:${widgetId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
      }
      this.cache.delete(key);
    });

    logger.debug(`Invalidated ${keysToDelete.length} cache entries for widget ${widgetId}`);
  }

  public invalidateDashboard(dashboardId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`dashboard:${dashboardId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
      }
      this.cache.delete(key);
    });

    logger.debug(`Invalidated ${keysToDelete.length} cache entries for dashboard ${dashboardId}`);
  }

  public clear(): void {
    this.cache.clear();
    this.stats = {
      hitCount: 0,
      missCount: 0,
      totalRequests: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
    };
    logger.debug('Cache cleared');
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getInfo(): { size: string; entries: number; hitRate: string } {
    return {
      size: `${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
      entries: this.stats.entryCount,
      hitRate: `${this.stats.hitRate.toFixed(1)}%`,
    };
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const widgetCacheManager = new WidgetCacheManager();

// Hook for using cache in React components
export function useWidgetCache() {
  return {
    getWidget: widgetCacheManager.getWidget.bind(widgetCacheManager),
    setWidget: widgetCacheManager.setWidget.bind(widgetCacheManager),
    getWidgetData: widgetCacheManager.getWidgetData.bind(widgetCacheManager),
    setWidgetData: widgetCacheManager.setWidgetData.bind(widgetCacheManager),
    getDashboard: widgetCacheManager.getDashboard.bind(widgetCacheManager),
    setDashboard: widgetCacheManager.setDashboard.bind(widgetCacheManager),
    invalidateWidget: widgetCacheManager.invalidateWidget.bind(widgetCacheManager),
    invalidateDashboard: widgetCacheManager.invalidateDashboard.bind(widgetCacheManager),
    getStats: widgetCacheManager.getStats.bind(widgetCacheManager),
    getInfo: widgetCacheManager.getInfo.bind(widgetCacheManager),
  };
}