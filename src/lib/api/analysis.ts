import { supabase } from "@/integrations/supabase/client";
import type { OptimizedAnalysisInput, OptimizedAnalysisResult } from "@/types/optimizedAnalysis";

/**
 * Typed client for optimized analysis RPC calls
 */
export class AnalysisApiClient {
  /**
   * Runs optimized analysis for a client's dataset
   * Replaces client-side loops with server-side aggregations
   */
  async runOptimizedAnalysis(input: OptimizedAnalysisInput): Promise<OptimizedAnalysisResult> {
    const { data, error } = await supabase.rpc('optimized_analysis', {
      p_client_id: input.clientId,
      p_dataset_id: input.datasetId || null
    });

    if (error) {
      console.error('Optimized analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message} (Request ID: ${crypto.randomUUID()})`);
    }

    if (!data) {
      throw new Error('No analysis data returned');
    }

    // Parse the JSON response from the RPC function
    return typeof data === 'string' ? JSON.parse(data) : (data as unknown) as OptimizedAnalysisResult;
  }

  /**
   * Gets the current timestamp for "Sist oppdatert" display
   */
  getCurrentTimestamp(): string {
    return new Date().toLocaleString('no-NO', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export singleton instance
export const analysisApiClient = new AnalysisApiClient();

/**
 * Convenience function for direct RPC calls
 */
export const getOptimizedAnalysis = (input: OptimizedAnalysisInput) => 
  analysisApiClient.runOptimizedAnalysis(input);