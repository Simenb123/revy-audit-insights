import { logger } from '@/utils/logger';

import { useState, useEffect } from 'react';
import { getAIUsageStats, getFirmAIUsageStats } from '@/services/revy/usageStatsService';

interface AIUsageLog {
  id: string;
  user_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  request_type: string;
  context_type: string | null;
  response_time_ms: number | null;
  created_at: string;
}

interface AIUsageStats {
  logs: AIUsageLog[];
  summary: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
    modelUsage: Record<string, number>;
    contextUsage: Record<string, number>;
  };
}

export const useAIUsage = (timeframe: 'day' | 'week' | 'month' = 'week') => {
  const [personalStats, setPersonalStats] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonalStats();
  }, [timeframe]);

  const loadPersonalStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await getAIUsageStats(timeframe);
      setPersonalStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved henting av statistikk');
      logger.error('Error loading personal AI stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadPersonalStats();
  };

  return {
    personalStats,
    loading,
    error,
    refresh
  };
};

export const useFirmAIUsage = (timeframe: 'day' | 'week' | 'month' = 'week') => {
  const [firmStats, setFirmStats] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFirmStats();
  }, [timeframe]);

  const loadFirmStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFirmAIUsageStats(timeframe);
      // Ensure we're setting an array, not an object with logs property
      setFirmStats(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved henting av firmastatistikk');
      logger.error('Error loading firm AI stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadFirmStats();
  };

  return {
    firmStats,
    loading,
    error,
    refresh
  };
};
