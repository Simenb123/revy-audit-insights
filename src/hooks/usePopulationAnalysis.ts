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
  };
}

export function usePopulationAnalysis(
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[],
  trialBalanceVersion?: string
) {
  // Debounce parameters to prevent race conditions during rapid state changes
  const debouncedClientId = useDebounce(clientId, 300);
  const debouncedSelectedStandardNumbers = useDebounce(selectedStandardNumbers, 500);
  const debouncedExcludedAccountNumbers = useDebounce(excludedAccountNumbers, 500);
  const debouncedTrialBalanceVersion = useDebounce(trialBalanceVersion, 300);

  // Create stable query key using debounced values to prevent infinite re-renders
  const stableQueryKey = [
    'population-analysis-v3', // Increment version to invalidate old cache
    debouncedClientId,
    fiscalYear,
    debouncedSelectedStandardNumbers.length > 0 ? debouncedSelectedStandardNumbers.slice().sort().join(',') : 'none',
    debouncedExcludedAccountNumbers.length > 0 ? debouncedExcludedAccountNumbers.slice().sort().join(',') : 'none',
    debouncedTrialBalanceVersion || 'latest'
  ];

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<PopulationAnalysisData> => {
      console.log('[Population Analysis] Starting with TB version:', debouncedTrialBalanceVersion);
      console.log('[Population Analysis] Using debounced parameters to prevent race conditions');
      
      if (!debouncedTrialBalanceVersion) {
        console.warn('[Population Analysis] No trial balance version provided, using null');
      }
      
      // Call the RPC function using debounced parameters to prevent race conditions
      const { data, error } = await supabase.rpc('calculate_population_analysis', {
        p_client_id: debouncedClientId,
        p_fiscal_year: fiscalYear,
        p_selected_standard_numbers: debouncedSelectedStandardNumbers,
        p_excluded_account_numbers: debouncedExcludedAccountNumbers,
        p_version_string: debouncedTrialBalanceVersion || null
      });
      
      console.log('[Population Analysis] RPC response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('[Population Analysis] RPC Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
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
          totalRecords: responseData.totalRecords
        }
      };
    },
    enabled: !!debouncedClientId && debouncedSelectedStandardNumbers.length > 0,
    retry: (failureCount, error: any) => {
      // Don't retry on specific business logic errors
      if (error?.message?.includes('invalid input syntax for type uuid')) {
        console.error('[Population Analysis] UUID format error - not retrying');
        return false;
      }
      if (error?.message?.includes('No data returned')) {
        console.error('[Population Analysis] No data error - not retrying');
        return false;
      }
      return failureCount < 2; // Only retry twice for other errors
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 3 * 60 * 1000, // 3 minutes - reduced to prevent stale data during race conditions
    gcTime: 10 * 60 * 1000, // 10 minutes - reduced for better memory management
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent unnecessary re-fetching on mount
    refetchInterval: false, // Disable background refetching to prevent race conditions
    notifyOnChangeProps: ['data', 'error', 'isLoading'] // Only notify on essential prop changes
  });
}