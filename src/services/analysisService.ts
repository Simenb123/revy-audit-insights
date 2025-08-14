import { supabase } from '@/integrations/supabase/client';
import { controlTestSuite, ControlTestResult } from './controlTestSuite';
import { riskScoringService, RiskScoringResults } from './riskScoringService';

export interface AnalysisRequest {
  clientId: string;
  dataVersionId: string;
  analysisType: 'transaction_patterns' | 'risk_analysis' | 'financial_ratios' | 'anomaly_detection';
  filterCriteria?: any;
  configuration?: any;
  customConfig?: any;
  progressCallback?: (step: string, progressPercent: number) => void;
}

export interface AnalysisResult {
  analysis_type: string;
  result_data: any;
  metadata: any;
  confidence_score: number;
}

// This service will act as the bridge between TypeScript frontend and future Python analytics
export class AnalysisService {
  
  /**
   * Phase 1: TypeScript-based basic analysis including controls and risk scoring
   */
  async performBasicTransactionAnalysis(request: AnalysisRequest): Promise<any> {
    // Get transaction data for analysis
    const { data: transactions, error } = await supabase
      .from('general_ledger_transactions')
      .select('transaction_date, debit_amount, credit_amount, balance_amount, description, client_chart_of_accounts(account_number)')
      .eq('version_id', request.dataVersionId)
      .order('transaction_date', { ascending: true });

    if (error) throw error;
    if (!transactions || transactions.length === 0) {
      throw new Error('No transaction data found');
    }

    // Basic TypeScript analysis
    const analysis = {
      total_transactions: transactions.length,
      date_range: {
        start: transactions[0]?.transaction_date,
        end: transactions[transactions.length - 1]?.transaction_date
      },
      account_distribution: this.calculateAccountDistribution(transactions),
      amount_statistics: this.calculateAmountStatistics(transactions),
      monthly_summary: this.calculateMonthlySummary(transactions)
    };

    return analysis;
  }

  /**
   * Comprehensive analysis including controls, risk scoring, and AI insights
   */
  async performComprehensiveAnalysis(request: AnalysisRequest): Promise<{
    basicAnalysis: any;
    controlTests: ControlTestResult[];
    riskScoring: RiskScoringResults;
    aiAnalysis?: any;
  }> {
    // Run basic analysis
    const basicAnalysis = await this.performBasicTransactionAnalysis(request);
    
    // Run control tests
    const controlTests = await controlTestSuite.runCompleteControlTests(
      request.clientId, 
      request.dataVersionId
    );
    
    // Get transaction data for risk scoring
    const { data: transactions } = await supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        debit_amount,
        credit_amount,
        description,
        voucher_number,
        client_chart_of_accounts(account_number)
      `)
      .eq('version_id', request.dataVersionId);
    
    // Run risk scoring
    const riskScoring = await riskScoringService.scoreTransactionRisk(transactions || []);
    
    // Run AI analysis if requested
    let aiAnalysis;
    if (request.analysisType === 'anomaly_detection' || request.analysisType === 'risk_analysis') {
      try {
        aiAnalysis = await this.performAIAnalysis(request);
      } catch (error) {
        console.warn('AI analysis failed:', error);
        aiAnalysis = null;
      }
    }
    
    return {
      basicAnalysis,
      controlTests,
      riskScoring,
      aiAnalysis
    };
  }

  /**
   * Phase 2: AI-powered analysis using edge functions
   */
  async performAIAnalysis(request: AnalysisRequest): Promise<any> {
    const { data, error } = await supabase.functions.invoke('ai-transaction-analysis', {
      body: {
        clientId: request.clientId,
        versionId: request.dataVersionId,
        analysisType: request.analysisType,
        maxTransactions: 1000
      }
    });

    if (error) {
      console.error('AI Analysis error:', error);
      throw new Error(`AI Analysis failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Phase 2: This will call Python FastAPI microservice
   * For now, it returns a placeholder structure
   */
  async performAdvancedAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    // Try AI analysis first
    if (request.analysisType === 'anomaly_detection' || request.analysisType === 'risk_analysis') {
      try {
        return await this.performAIAnalysis(request);
      } catch (error) {
        console.warn('AI analysis failed, falling back to placeholder:', error);
      }
    }

    // TODO: Replace with actual Python FastAPI call
    // const response = await fetch(`${PYTHON_API_URL}/analyze`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // });
    // return response.json();

    // Placeholder for Python analysis
    return {
      analysis_type: request.analysisType,
      result_data: {
        message: 'Advanced analysis will be implemented with Python microservice',
        placeholder: true,
        request_summary: request
      },
      metadata: {
        version: '1.0.0',
        implementation: 'typescript_placeholder'
      },
      confidence_score: 0.0
    };
  }

  /**
   * Store analysis results in database
   */
  async storeAnalysisResults(sessionId: string, results: AnalysisResult[]): Promise<void> {
    const { error } = await supabase
      .from('analysis_results_v2')
      .insert(
        results.map(result => ({
          session_id: sessionId,
          ...result
        }))
      );

    if (error) throw error;
  }

  /**
   * Caching system for filtered data
   */
  async cacheFilteredData(
    clientId: string, 
    dataVersionId: string, 
    filterCriteria: any, 
    summary: any
  ): Promise<void> {
    const filterHash = this.generateFilterHash(filterCriteria);
    
    const { error } = await supabase
      .from('filtered_data_cache')
      .upsert({
        client_id: clientId,
        data_version_id: dataVersionId,
        filter_hash: filterHash,
        filter_criteria: filterCriteria,
        filtered_data_summary: summary
      });

    if (error) throw error;
  }

  /**
   * Get cached filtered data
   */
  async getCachedFilteredData(
    clientId: string, 
    dataVersionId: string, 
    filterCriteria: any
  ): Promise<any | null> {
    const filterHash = this.generateFilterHash(filterCriteria);
    
    const { data, error } = await supabase
      .from('filtered_data_cache')
      .select('*')
      .eq('client_id', clientId)
      .eq('data_version_id', dataVersionId)
      .eq('filter_hash', filterHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) return null;
    return data?.filtered_data_summary || null;
  }

  // Helper methods for TypeScript analysis
  private calculateAccountDistribution(transactions: any[]): { account: string; count: number }[] {
    const distribution: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const accountNumber = (tx as any).client_chart_of_accounts?.account_number || 'Unknown';
      distribution[accountNumber] = (distribution[accountNumber] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([account, count]) => ({ account, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateAmountStatistics(transactions: any[]) {
    const amounts = transactions.map(tx =>
      tx.debit_amount ?? -(tx.credit_amount ?? 0)
    );

    return {
      total_count: amounts.length,
      sum: amounts.reduce((sum, amt) => sum + amt, 0),
      average: amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length,
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      positive_count: amounts.filter(amt => amt > 0).length,
      negative_count: amounts.filter(amt => amt < 0).length
    };
  }

  private calculateMonthlySummary(transactions: any[]) {
    const monthlyData: Record<string, { count: number; sum: number }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = tx.debit_amount ?? -(tx.credit_amount ?? 0);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, sum: 0 };
      }

      monthlyData[monthKey].count++;
      monthlyData[monthKey].sum += amount;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private generateFilterHash(filterCriteria: any): string {
    // Simple hash function for caching - could be improved
    return btoa(JSON.stringify(filterCriteria))
      .replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m] || m))
      .substring(0, 32);
  }
}

export const analysisService = new AnalysisService();