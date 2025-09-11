import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizedAnalysisService } from '@/services/optimizedAnalysisService';
import type { OptimizedAnalysisInput, OptimizedAnalysisResult } from '@/types/optimizedAnalysis';

/**
 * React Query hook for optimized analysis
 * 
 * @param input - Analysis parameters (clientId required, datasetId optional)
 * @param options - React Query options
 * @returns Query result with analysis data
 * 
 * @example
 * ```typescript
 * function AnalysisDashboard({ clientId }: { clientId: string }) {
 *   const { data: analysis, isLoading, error, refetch } = useOptimizedAnalysis({
 *     clientId,
 *     datasetId: 'optional-dataset-id'
 *   });
 * 
 *   if (isLoading) return <div>Analyzing...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!analysis) return <div>No data</div>;
 * 
 *   return (
 *     <div>
 *       <h2>Analysis Results</h2>
 *       <p>Total transactions: {analysis.total_transactions}</p>
 *       <p>Date range: {analysis.date_range.start} to {analysis.date_range.end}</p>
 *       <p>Trial balance balanced: {analysis.trial_balance_crosscheck.balanced ? 'Yes' : 'No'}</p>
 *       
 *       <h3>Data Quality Issues</h3>
 *       {analysis.data_quality_flags.map(flag => (
 *         <div key={flag.code} className={`alert-${flag.severity}`}>
 *           {flag.code}: {flag.count} issues ({flag.severity} severity)
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOptimizedAnalysis(
  input: OptimizedAnalysisInput,
  options: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['optimized-analysis', input.clientId, input.datasetId],
    queryFn: () => optimizedAnalysisService.runAnalysis(input),
    enabled: options.enabled !== false && !!input.clientId,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Mutation hook for running analysis on-demand
 * Useful for triggered analysis or when parameters change frequently
 * 
 * @example
 * ```typescript
 * function AnalysisControls() {
 *   const runAnalysis = useRunOptimizedAnalysis();
 * 
 *   const handleAnalyze = async (clientId: string) => {
 *     try {
 *       const result = await runAnalysis.mutateAsync({ clientId });
 *       console.log('Analysis complete:', result);
 *     } catch (error) {
 *       console.error('Analysis failed:', error);
 *     }
 *   };
 * 
 *   return (
 *     <button 
 *       onClick={() => handleAnalyze('client-uuid')}
 *       disabled={runAnalysis.isPending}
 *     >
 *       {runAnalysis.isPending ? 'Analyzing...' : 'Run Analysis'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useRunOptimizedAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OptimizedAnalysisInput) => 
      optimizedAnalysisService.runAnalysis(input),
    onSuccess: (data, variables) => {
      // Update the query cache with fresh data
      queryClient.setQueryData(
        ['optimized-analysis', variables.clientId, variables.datasetId],
        data
      );
    },
  });
}

/**
 * Hook for batch analysis across multiple clients
 * 
 * @example
 * ```typescript
 * function BatchAnalysis() {
 *   const batchAnalysis = useBatchOptimizedAnalysis();
 * 
 *   const handleBatchAnalyze = async () => {
 *     const clients = [
 *       { clientId: 'client-1' },
 *       { clientId: 'client-2' },
 *       { clientId: 'client-3' }
 *     ];
 * 
 *     try {
 *       const results = await batchAnalysis.mutateAsync(clients);
 *       console.log('Batch analysis complete:', results);
 *     } catch (error) {
 *       console.error('Batch analysis failed:', error);
 *     }
 *   };
 * 
 *   return (
 *     <button 
 *       onClick={handleBatchAnalyze}
 *       disabled={batchAnalysis.isPending}
 *     >
 *       {batchAnalysis.isPending ? 'Running Batch Analysis...' : 'Analyze All Clients'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBatchOptimizedAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputs: OptimizedAnalysisInput[]) =>
      optimizedAnalysisService.runBatchAnalysis(inputs),
    onSuccess: (results, variables) => {
      // Update cache for each result
      results.forEach((result, index) => {
        const input = variables[index];
        queryClient.setQueryData(
          ['optimized-analysis', input.clientId, input.datasetId],
          result
        );
      });
    },
  });
}

/**
 * Hook for getting derived metrics from analysis results
 * 
 * @param analysis - Analysis result data
 * @returns Computed financial and quality metrics
 * 
 * @example
 * ```typescript
 * function MetricsSummary({ clientId }: { clientId: string }) {
 *   const { data: analysis } = useOptimizedAnalysis({ clientId });
 *   const metrics = useAnalysisMetrics(analysis);
 * 
 *   if (!metrics) return null;
 * 
 *   return (
 *     <div className="metrics-grid">
 *       <div className="metric">
 *         <h4>Data Quality Score</h4>
 *         <span className="score">{metrics.qualityScore}%</span>
 *       </div>
 *       <div className="metric">
 *         <h4>Total Volume</h4>
 *         <span>{(metrics.totalDebit + metrics.totalCredit).toLocaleString()}</span>
 *       </div>
 *       <div className="metric">
 *         <h4>Monthly Volatility</h4>
 *         <span>{metrics.volatility.toFixed(2)}</span>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAnalysisMetrics(analysis: OptimizedAnalysisResult | undefined) {
  if (!analysis) return null;

  const qualityMetrics = optimizedAnalysisService.getDataQualitySummary(analysis);
  const financialMetrics = optimizedAnalysisService.getFinancialMetrics(analysis);

  return {
    ...qualityMetrics,
    ...financialMetrics,
    transactionCount: analysis.total_transactions,
    isBalanced: analysis.trial_balance_crosscheck.balanced,
    balanceDifference: analysis.trial_balance_crosscheck.diff,
  };
}