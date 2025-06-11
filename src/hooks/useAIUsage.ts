
import { useState, useEffect } from 'react';
import { getAIUsageStats, getFirmAIUsageStats } from '@/services/revyService';
import { AIUsageStats } from '@/types/revio';

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
      console.error('Error loading personal AI stats:', err);
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
      const stats = await getFirmAIUsageStats(timeframe);
      setFirmStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved henting av firmastatistikk');
      console.error('Error loading firm AI stats:', err);
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
