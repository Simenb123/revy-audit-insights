import { useQuery, useQueries } from '@tanstack/react-query';
import { useTrialBalanceWithMappings, fetchTrialBalanceWithMappings } from './useTrialBalanceWithMappings';
import { logger } from '@/utils/logger';

export interface ScopedTrialBalanceData {
  clientId: string;
  companyName: string;
  trialBalance: any;
}

/**
 * Universal hook for trial balance data with mappings across different scopes.
 * Supports single client or multi-client aggregation.
 * Uses TanStack Query cache with stable keys for optimal performance.
 */
export function useScopedTrialBalanceWithMappings(
  clientIds: string[],
  fiscalYear: number,
  versionId?: string
) {
  const hasMultipleClients = clientIds.length > 1;
  const singleClientId = clientIds.length === 1 ? clientIds[0] : null;

  // For single client, use existing hook directly
  const singleClientQuery = useTrialBalanceWithMappings(
    singleClientId || '',
    fiscalYear,
    versionId
  );

  // For multiple clients, fetch each client's data in parallel using useQueries
  const multiClientQueries = useQueries({
    queries: hasMultipleClients
      ? clientIds.map((clientId) => ({
          queryKey: ['trial-balance-with-mappings', clientId, fiscalYear, versionId],
          queryFn: () => fetchTrialBalanceWithMappings(clientId, fiscalYear, versionId),
          staleTime: 1000 * 60 * 5,
          enabled: true,
        }))
      : [],
  });

  if (singleClientId) {
    return {
      data: singleClientQuery.data ? [{
        clientId: singleClientId,
        companyName: 'Current Client',
        trialBalance: singleClientQuery.data
      }] : undefined,
      isLoading: singleClientQuery.isLoading,
      error: singleClientQuery.error,
      refetch: singleClientQuery.refetch
    };
  }

  return {
    data: hasMultipleClients
      ? clientIds.map((clientId, idx) => ({
          clientId,
          companyName: `Client ${clientId}`,
          trialBalance: multiClientQueries[idx]?.data,
        }))
      : [],
    isLoading: multiClientQueries.some((q) => q.isLoading),
    error: multiClientQueries.find((q) => q.error)?.error,
    refetch: async () => {
      await Promise.all(multiClientQueries.map((q) => q.refetch()));
    },
  };
}