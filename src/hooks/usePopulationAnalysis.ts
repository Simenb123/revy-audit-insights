import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

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
    versionString?: string;
    analysisTimestamp: string;
    totalRecords: number;
    isEmpty?: boolean; // Add isEmpty property to fix type errors
  };
}

export function usePopulationAnalysis(
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[],
  trialBalanceVersion?: string,
  populationAccountNumbers?: string[] // Add mapped account numbers parameter
) {
  // Remove debouncing since we fixed conditional hook issues - no longer needed
  const debouncedClientId = clientId;
  const debouncedSelectedStandardNumbers = selectedStandardNumbers;
  const debouncedExcludedAccountNumbers = excludedAccountNumbers;
  const debouncedTrialBalanceVersion = trialBalanceVersion;
  const debouncedPopulationAccountNumbers = populationAccountNumbers || [];

  // Debug logging
  console.debug('[PopulationAnalysis] Input parameters:');
  console.debug('- Standards:', debouncedSelectedStandardNumbers);
  console.debug('- Mapped accounts:', debouncedPopulationAccountNumbers.length);
  console.debug('- Version:', debouncedTrialBalanceVersion);

  // Create stable query key - include mapped accounts for better caching
  const stableQueryKey = [
    'population-analysis-v5', // Increment version for mapping changes
    debouncedClientId,
    fiscalYear,
    debouncedSelectedStandardNumbers.slice().sort().join('|'),
    debouncedPopulationAccountNumbers.slice().sort().join('|'), // Use mapped accounts
    debouncedExcludedAccountNumbers.slice().sort().join('|'),
    debouncedTrialBalanceVersion || 'auto'
  ];

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<PopulationAnalysisData> => {      
      // Call the RPC function
      const { data, error } = await supabase.rpc('calculate_population_analysis', {
        p_client_id: debouncedClientId,
        p_fiscal_year: fiscalYear,
        p_selected_standard_numbers: debouncedSelectedStandardNumbers,
        p_excluded_account_numbers: debouncedExcludedAccountNumbers,
        p_version_string: debouncedTrialBalanceVersion || null
      });

      if (error) {
        throw error;
      }

      if (!data || typeof data !== 'object') {
        throw new Error('No data returned from population analysis');
      }

      // Type the enhanced backend response
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
          p10?: number;
          p90?: number;
          skewness?: number;
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
          zScore?: number;
          iqrScore?: number;
          detectionMethod?: string;
        }>;
        anomalies: Array<{
          accountNumber: string;
          accountName: string;
          anomalyType: string;
          severity: 'high' | 'medium' | 'low';
          description: string;
          closingBalance: number;
        }>;
        trendAnalysis: {
          trend: 'stable' | 'increasing' | 'decreasing' | 'insufficient_data';
          seasonality: 'none' | 'detected';
        };
        timeSeries: Array<{
          month: string;
          transactionCount: number;
          totalAmount: number;
          avgAmount?: number;
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

      // Transform the enhanced backend response to match our frontend interface
      const basicStats = responseData.basicStats;
      const counterAccounts = responseData.counterAccounts || [];
      const outliers = responseData.outliers || [];
      const anomalies = responseData.anomalies || [];
      const trendAnalysis = responseData.trendAnalysis;
      const timeSeries = responseData.timeSeries || [];
      const accounts = responseData.accounts || [];
      const executionTime = responseData.executionTimeMs;

      // All calculations are now done on the backend with enhanced statistical analysis
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
            deviationScore: outlier.zScore || Math.abs(outlier.absBalance - basicStats.medianBalance) / (basicStats.stdDev || 1)
          })),
          outlierThreshold: 1.5 * basicStats.iqr
        },
        timeSeriesAnalysis: {
          monthlyData: timeSeries.map((ts) => ({
            month: ts.month,
            transactionCount: ts.transactionCount,
            totalAmount: ts.totalAmount
          })),
          trend: trendAnalysis?.trend || 'insufficient_data',
          seasonality: trendAnalysis?.seasonality || 'none'
        },
        anomalyDetection: {
          anomalies: anomalies.map((anomaly) => ({
            accountNumber: anomaly.accountNumber,
            accountName: anomaly.accountName,
            anomalyType: anomaly.anomalyType,
            severity: anomaly.severity as 'high' | 'medium' | 'low',
            description: anomaly.description
          })),
          anomalyScore: anomalies.length / Math.max(basicStats.totalAccounts, 1) * 100
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
          clientId: debouncedClientId,
          fiscalYear,
          selectedStandardNumbers: debouncedSelectedStandardNumbers,
          excludedAccountNumbers: debouncedExcludedAccountNumbers,
          versionString: debouncedTrialBalanceVersion,
          analysisTimestamp: new Date().toISOString(),
          totalRecords: responseData.totalRecords,
          isEmpty: responseData.totalRecords === 0 // Add isEmpty based on data
        }
      };
    },
    // 3) Gate: kjør først når mappingen har gitt minst én konto
    enabled: 
      !!debouncedClientId && 
      debouncedSelectedStandardNumbers.length > 0 &&
      debouncedPopulationAccountNumbers.length > 0, // Wait for mapping
    retry: (failureCount, error: any) => {
      // Don't retry on specific business logic errors
      if (error?.message?.includes('invalid input syntax for type uuid')) {
        return false;
      }
      if (error?.message?.includes('No data returned')) {
        return false;
      }
      return failureCount < 2; // Only retry twice for other errors
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes - increased back since race conditions are fixed
    gcTime: 15 * 60 * 1000, // 15 minutes - increased back for better caching
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Keep disabled as it's not needed
    refetchInterval: false, // Keep disabled as it's not needed
    notifyOnChangeProps: ['data', 'error', 'isLoading'] // Only notify on essential prop changes
  });
}