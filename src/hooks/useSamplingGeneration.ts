import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SamplingParams, SamplingResult } from '@/services/sampling/types';

interface GenerateSampleInput {
  clientId: string;
  versionId: string;
  params: SamplingParams;
}

/**
 * Hook for generating audit samples via backend edge function
 * Replaces client-side sampling logic with server-side processing
 */
export function useSamplingGeneration() {
  const mutation = useMutation({
    mutationFn: async ({ clientId, versionId, params }: GenerateSampleInput) => {
      console.log('[useSamplingGeneration] Generating sample', { clientId, versionId, method: params.method });

      const { data, error } = await supabase.functions.invoke('generate-audit-sample', {
        body: {
          clientId,
          versionId,
          params
        }
      });

      if (error) {
        console.error('[useSamplingGeneration] Error:', error);
        throw new Error(`Failed to generate sample: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from sample generation');
      }

      console.log('[useSamplingGeneration] Sample generated successfully', {
        actualSampleSize: data.plan?.actualSampleSize,
        coverage: data.plan?.coveragePercentage
      });

      return data as SamplingResult;
    }
  });

  return {
    generateSample: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset
  };
}
