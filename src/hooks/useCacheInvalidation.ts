import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CacheInvalidationParams {
  clientId: string;
}

export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateAnalysisCache = useMutation({
    mutationFn: async ({ clientId }: CacheInvalidationParams) => {
      const { error } = await supabase.rpc('invalidate_analysis_cache_for_client', {
        p_client_id: clientId
      });

      if (error) {
        throw new Error(`Cache invalidation failed: ${error.message}`);
      }

      return { success: true };
    },
    onSuccess: (_, { clientId }) => {
      // Invalidate all related queries for this client
      queryClient.invalidateQueries({
        queryKey: ['optimized-analysis', clientId]
      });
      queryClient.invalidateQueries({
        queryKey: ['analysis', clientId]
      });
      queryClient.invalidateQueries({
        queryKey: ['fetch-ledger-transactions', clientId]
      });
    },
  });

  const invalidateClientCache = (clientId: string) => {
    return invalidateAnalysisCache.mutateAsync({ clientId });
  };

  return {
    invalidateClientCache,
    isInvalidating: invalidateAnalysisCache.isPending,
  };
}