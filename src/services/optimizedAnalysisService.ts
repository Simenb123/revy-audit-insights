import { supabase } from "@/integrations/supabase/client";
import type { OptimizedAnalysisInput, OptimizedAnalysisResult } from "@/types/optimizedAnalysis";

/**
 * Service for calling the optimized analysis RPC function
 * Performs server-side aggregations for maximum performance
 */
export class OptimizedAnalysisService {
  /**
   * Runs optimized analysis for a client's dataset
   * 
   * @param input - Analysis parameters
   * @returns Comprehensive analysis results
   * 
   * @example
   * ```typescript
   * const service = new OptimizedAnalysisService();
   * const result = await service.runAnalysis({
   *   clientId: 'uuid-here',
   *   datasetId: 'optional-dataset-uuid'
   * });
   * 
   * console.log(`Found ${result.total_transactions} transactions`);
   * console.log(`Trial balance ${result.trial_balance_crosscheck.balanced ? 'is' : 'is not'} balanced`);
   * ```
   */
  async runAnalysis(input: OptimizedAnalysisInput): Promise<OptimizedAnalysisResult> {
    const { data, error } = await supabase.rpc('optimized_analysis', {
      p_client_id: input.clientId,
      p_dataset_id: input.datasetId || null
    });

    if (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No analysis data returned');
    }

    // Parse the JSON response from the RPC function
    return typeof data === 'string' ? JSON.parse(data) : (data as unknown) as OptimizedAnalysisResult;
  }

  /**
   * Runs analysis for multiple clients (batch processing)
   * 
   * @param inputs - Array of analysis parameters
   * @returns Array of analysis results
   */
  async runBatchAnalysis(inputs: OptimizedAnalysisInput[]): Promise<OptimizedAnalysisResult[]> {
    const promises = inputs.map(input => this.runAnalysis(input));
    return Promise.all(promises);
  }

  /**
   * Gets a summary of data quality issues across all severity levels
   * 
   * @param result - Analysis result
   * @returns Summary of data quality metrics
   */
  getDataQualitySummary(result: OptimizedAnalysisResult) {
    const flags = result.data_quality_flags;
    const highSeverity = flags.filter(f => f.severity === 'high');
    const mediumSeverity = flags.filter(f => f.severity === 'med');
    const lowSeverity = flags.filter(f => f.severity === 'low');

    const totalIssues = flags.reduce((sum, flag) => sum + flag.count, 0);

    return {
      totalIssues,
      highSeverityCount: highSeverity.reduce((sum, flag) => sum + flag.count, 0),
      mediumSeverityCount: mediumSeverity.reduce((sum, flag) => sum + flag.count, 0),
      lowSeverityCount: lowSeverity.reduce((sum, flag) => sum + flag.count, 0),
      qualityScore: Math.max(0, 100 - (highSeverity.length * 20 + mediumSeverity.length * 10 + lowSeverity.length * 5))
    };
  }

  /**
   * Calculates key financial metrics from the analysis
   * 
   * @param result - Analysis result
   * @returns Key financial indicators
   */
  getFinancialMetrics(result: OptimizedAnalysisResult) {
    const monthlySummary = result.monthly_summary;
    
    if (!monthlySummary || monthlySummary.length === 0) {
      return {
        totalDebit: 0,
        totalCredit: 0,
        netAmount: 0,
        averageMonthlyVolume: 0,
        volatility: 0
      };
    }

    const totalDebit = monthlySummary.reduce((sum, month) => sum + month.debit, 0);
    const totalCredit = monthlySummary.reduce((sum, month) => sum + month.credit, 0);
    const netAmount = totalDebit - totalCredit;
    const averageMonthlyVolume = (totalDebit + totalCredit) / (monthlySummary.length * 2);

    // Calculate monthly volatility (standard deviation of net amounts)
    const monthlyNets = monthlySummary.map(m => m.net);
    const avgNet = monthlyNets.reduce((sum, net) => sum + net, 0) / monthlyNets.length;
    const variance = monthlyNets.reduce((sum, net) => sum + Math.pow(net - avgNet, 2), 0) / monthlyNets.length;
    const volatility = Math.sqrt(variance);

    return {
      totalDebit,
      totalCredit,
      netAmount,
      averageMonthlyVolume,
      volatility
    };
  }
}

// Export singleton instance
export const optimizedAnalysisService = new OptimizedAnalysisService();