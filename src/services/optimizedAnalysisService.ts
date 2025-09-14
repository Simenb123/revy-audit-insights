import { supabase } from "@/integrations/supabase/client";
import type { OptimizedAnalysisInput, OptimizedAnalysisResult } from "@/types/optimizedAnalysis";

/**
 * Enhanced service for optimized analysis with server-side SQL aggregations
 * 
 * This service interfaces with the optimized_analysis Supabase RPC function
 * which performs all heavy calculations on the database server rather than
 * in the browser, providing faster analysis for large datasets.
 * 
 * Key features:
 * - Server-side aggregations using SQL CTEs
 * - Comprehensive statistics (totals, distributions, quality checks)
 * - Enhanced amount statistics (min, max, average, counts)
 * - Future: Server-side caching for sub-second response times
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
   * Enhanced financial metrics calculation
   * 
   * Uses server-provided statistics when available (enhanced version),
   * falls back to calculations from aggregated data for compatibility.
   */
  getFinancialMetrics(result: OptimizedAnalysisResult) {
    // Use server-provided amount statistics if available (enhanced version)
    if (result.amount_statistics) {
      return {
        totalDebit: result.overview?.total_debit ?? 0,
        totalCredit: result.overview?.total_credit ?? 0,
        netAmount: result.overview?.total_net ?? 0,
        averageAmount: result.amount_statistics.average,
        minAmount: result.amount_statistics.min,
        maxAmount: result.amount_statistics.max,
        positiveTransactions: result.amount_statistics.positive_count,
        negativeTransactions: result.amount_statistics.negative_count,
        transactionCount: result.total_transactions,
        volatility: this.calculateVolatility(result.monthly_summary)
      };
    }

    // Legacy calculation for backwards compatibility
    const monthlySummary = result.monthly_summary;
    
    if (!monthlySummary || monthlySummary.length === 0) {
      return {
        totalDebit: 0,
        totalCredit: 0,
        netAmount: 0,
        averageAmount: 0,
        volatility: 0,
        transactionCount: result.total_transactions
      };
    }

    const totalDebit = monthlySummary.reduce((sum, month) => sum + month.debit, 0);
    const totalCredit = monthlySummary.reduce((sum, month) => sum + month.credit, 0);
    const netAmount = totalDebit - totalCredit;
    const averageMonthlyVolume = (totalDebit + totalCredit) / (monthlySummary.length * 2);

    return {
      totalDebit,
      totalCredit,
      netAmount,
      averageAmount: averageMonthlyVolume,
      transactionCount: result.total_transactions,
      volatility: this.calculateVolatility(monthlySummary)
    };
  }

  /**
   * Calculate volatility from monthly summary data
   */
  private calculateVolatility(monthlySummary: any[]): number {
    if (!monthlySummary || monthlySummary.length === 0) {
      return 0;
    }

    // Calculate monthly volatility (standard deviation of net amounts)
    const monthlyNets = monthlySummary.map(m => m.net);
    const avgNet = monthlyNets.reduce((sum, net) => sum + net, 0) / monthlyNets.length;
    const variance = monthlyNets.reduce((sum, net) => sum + Math.pow(net - avgNet, 2), 0) / monthlyNets.length;
    return Math.sqrt(variance);
  }
}

// Export singleton instance
export const optimizedAnalysisService = new OptimizedAnalysisService();