import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CounterAccountDistribution {
  counterAccount: string;
  counterAccountName: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

export interface OutlierDetection {
  accountNumber: string;
  accountName: string;
  closingBalance: number;
  outlierType: 'high' | 'low';
  deviationScore: number;
}

export interface AnomalyDetection {
  accountNumber: string;
  accountName: string;
  anomalyType: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface BasicStatistics {
  totalAccounts: number;
  accountsWithBalance: number;
  totalSum: number;
  averageBalance: number;
  medianBalance: number;
  q1: number;
  q3: number;
  minBalance: number;
  maxBalance: number;
  stdDev: number;
  iqr: number;
}

export interface TimeSeriesData {
  month: string;
  transactionCount: number;
  totalAmount: number;
}

export interface PopulationAnalysisData {
  basicStatistics: BasicStatistics;
  counterAccountAnalysis: CounterAccountDistribution[];
  outlierDetection: {
    outliers: OutlierDetection[];
    outlierThreshold: number;
  };
  timeSeriesAnalysis: {
    monthlyData: TimeSeriesData[];
    trend: 'stable' | 'increasing' | 'decreasing' | 'insufficient_data';
    seasonality: 'none' | 'detected';
  };
  anomalyDetection: {
    anomalies: AnomalyDetection[];
    anomalyScore: number;
  };
  accounts: Array<{
    id: string;
    account_number: string;
    account_name: string;
    closing_balance: number;
    transaction_count: number;
  }>;
  executionTime: number;
  metadata: {
    clientId: string;
    fiscalYear: number;
    selectedStandardNumbers: string[];
    excludedAccountNumbers: string[];
    versionId?: string;
    analysisTimestamp: string;
    totalRecords: number;
  };
}

export function usePopulationAnalysis(
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[],
  versionId?: string
) {
  return useQuery({
    queryKey: ['population-analysis', clientId, fiscalYear, selectedStandardNumbers, excludedAccountNumbers, versionId],
    queryFn: async (): Promise<PopulationAnalysisData> => {
      // Use the new comprehensive SQL function
      const { data, error } = await supabase.rpc('calculate_population_analysis', {
        p_client_id: clientId,
        p_fiscal_year: fiscalYear,
        p_selected_standard_numbers: selectedStandardNumbers,
        p_excluded_account_numbers: excludedAccountNumbers,
        p_version_id: versionId || null
      });

      if (error) {
        console.error('Error calculating population analysis:', error);
        throw error;
      }

      if (!data || typeof data !== 'object') {
        throw new Error('No data returned from population analysis');
      }

      // Type the backend response
      const responseData = data as {
        basicStats: {
          totalAccounts: number;
          accountsWithBalance: number;
          totalSum: number;
          averageBalance: number;
          medianBalance: number;
          q1: number;
          q3: number;
          minBalance: number;
          maxBalance: number;
          stdDev: number;
          iqr: number;
        };
        counterAccounts: Array<{
          counterAccount: string;
          counterAccountName: string;
          transactionCount: number;
          totalAmount: number;
          percentage: number;
        }>;
        outliers: Array<{
          accountNumber: string;
          accountName: string;
          closingBalance: number;
          absBalance: number;
          outlierType: 'high' | 'low';
        }>;
        timeSeries: Array<{
          month: string;
          transactionCount: number;
          totalAmount: number;
        }>;
        accounts: Array<{
          id: string;
          accountNumber: string;
          accountName: string;
          closingBalance: number;
          transactionCount: number;
        }>;
        executionTimeMs: number;
        totalRecords: number;
        versionId?: string;
      };

      // Transform the backend response to match our frontend interface
      const basicStats = responseData.basicStats;
      const counterAccounts = responseData.counterAccounts || [];
      const outliers = responseData.outliers || [];
      const timeSeries = responseData.timeSeries || [];
      const accounts = responseData.accounts || [];
      const executionTime = responseData.executionTimeMs;

      // All calculations are now done on the backend
      return {
        basicStatistics: {
          totalAccounts: basicStats.totalAccounts,
          accountsWithBalance: basicStats.accountsWithBalance,
          totalSum: basicStats.totalSum,
          averageBalance: basicStats.averageBalance,
          medianBalance: basicStats.medianBalance,
          q1: basicStats.q1,
          q3: basicStats.q3,
          minBalance: basicStats.minBalance,
          maxBalance: basicStats.maxBalance,
          stdDev: basicStats.stdDev,
          iqr: basicStats.iqr
        },
        counterAccountAnalysis: counterAccounts.map((ca) => ({
          counterAccount: ca.counterAccount,
          counterAccountName: ca.counterAccountName,
          transactionCount: ca.transactionCount,
          totalAmount: ca.totalAmount,
          percentage: ca.percentage
        })),
        outlierDetection: {
          outliers: outliers.map((outlier) => ({
            accountNumber: outlier.accountNumber,
            accountName: outlier.accountName,
            closingBalance: outlier.closingBalance,
            outlierType: outlier.outlierType,
            deviationScore: Math.abs(outlier.absBalance - basicStats.medianBalance) / (basicStats.stdDev || 1)
          })),
          outlierThreshold: 1.5 * basicStats.iqr
        },
        timeSeriesAnalysis: {
          monthlyData: timeSeries.map((ts) => ({
            month: ts.month,
            transactionCount: ts.transactionCount,
            totalAmount: ts.totalAmount
          })),
          trend: timeSeries.length > 1 ? 'stable' : 'insufficient_data',
          seasonality: 'none'
        },
        anomalyDetection: {
          anomalies: outliers.slice(0, 5).map((outlier) => ({
            accountNumber: outlier.accountNumber,
            accountName: outlier.accountName,
            anomalyType: `balance_${outlier.outlierType}`,
            severity: outlier.outlierType === 'high' ? 'high' : 'medium',
            description: `Konto ${outlier.accountNumber} har en ${outlier.outlierType === 'high' ? 'uvanlig høy' : 'uvanlig lav'} saldo: ${Math.abs(outlier.closingBalance).toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}`
          })),
          anomalyScore: outliers.length / Math.max(basicStats.totalAccounts, 1) * 100
        },
        accounts: accounts.map((acc) => ({
          id: acc.id,
          account_number: acc.accountNumber,
          account_name: acc.accountName,
          closing_balance: acc.closingBalance,
          transaction_count: acc.transactionCount
        })),
        executionTime,
        metadata: {
          clientId,
          fiscalYear,
          selectedStandardNumbers,
          excludedAccountNumbers,
          versionId: responseData.versionId,
          analysisTimestamp: new Date().toISOString(),
          totalRecords: responseData.totalRecords
        }
      };
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}