import { useState, useEffect, useCallback } from 'react';
import { dataSourceManager } from '@/lib/dataSource';

export interface UseDataSourceOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  transformations?: any[];
}

export function useDataSource(dataSourceId: string, options: UseDataSourceOptions = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { autoRefresh = true, refreshInterval } = options;

  const fetchData = useCallback(async () => {
    if (!dataSourceId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dataSourceManager.fetchData(dataSourceId);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dataSourceId]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh subscription
  useEffect(() => {
    if (!autoRefresh || !dataSourceId) return;

    const unsubscribe = dataSourceManager.subscribe(dataSourceId, (newData) => {
      setData(newData);
      setLastUpdated(new Date());
    });

    return unsubscribe;
  }, [dataSourceId, autoRefresh]);

  // Manual refresh interval
  useEffect(() => {
    if (!refreshInterval || !autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval, autoRefresh]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
}