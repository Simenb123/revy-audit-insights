import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheService } from '@/services/cacheService';
import { PopulationAnalysisData } from './usePopulationAnalysis';

interface UseEnhancedPopulationAnalysisOptions {
  enableLocalCache?: boolean;
  cacheTimeout?: number;
  retryOnError?: boolean;
  backgroundRefresh?: boolean;
}

export function useEnhancedPopulationAnalysis(
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[],
  versionString?: string,
  options: UseEnhancedPopulationAnalysisOptions = {}
) {
  const {
    enableLocalCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    retryOnError = true,
    backgroundRefresh = true
  } = options;

  const cacheKey = {
    clientId,
    analysisType: 'population_analysis',
    configHash: btoa(JSON.stringify({
      fiscalYear,
      selectedStandardNumbers: selectedStandardNumbers.sort(),
      excludedAccountNumbers: excludedAccountNumbers.sort(),
      versionString
    })).slice(0, 16)
  };

  // Create stable query key to prevent infinite re-renders
  const stableQueryKey = [
    'enhanced-population-analysis',
    clientId,
    fiscalYear,
    selectedStandardNumbers.length > 0 ? selectedStandardNumbers.slice().sort().join(',') : 'none',
    excludedAccountNumbers.length > 0 ? excludedAccountNumbers.slice().sort().join(',') : 'none',
    versionString || 'latest'
  ];

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async (): Promise<PopulationAnalysisData> => {
      // Check cache first if enabled
      if (enableLocalCache) {
        const cachedResult = await cacheService.get<PopulationAnalysisData>(cacheKey);
        if (cachedResult) {
          console.log('[PopulationAnalysis] Cache hit, returning cached data');
          return cachedResult;
        }
      }

      console.log('[PopulationAnalysis] Cache miss, fetching from database');
      
      // Validate parameters
      if (selectedStandardNumbers.length === 0) {
        throw new Error('No standard numbers selected for analysis');
      }

      if (!clientId) {
        throw new Error('Client ID is required for population analysis');
      }

      // Fetch from enhanced SQL function with timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Population analysis timeout (30s)')), 30000)
      );

      const analysisPromise = supabase.rpc('calculate_population_analysis', {
        p_client_id: clientId,
        p_fiscal_year: fiscalYear,
        p_selected_standard_numbers: selectedStandardNumbers,
        p_excluded_account_numbers: excludedAccountNumbers,
        p_version_string: versionString || null
      });

      const { data, error } = await Promise.race([analysisPromise, timeoutPromise]);

      if (error) {
        console.error('Population analysis error:', error);
        throw new Error(`Population analysis failed: ${error.message}`);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data returned from population analysis');
      }

      // Transform and validate the response
      const responseData = data as any;
      
      const result: PopulationAnalysisData = {
        basicStatistics: {
          totalAccounts: responseData.basicStats?.totalAccounts || 0,
          accountsWithBalance: responseData.basicStats?.accountsWithBalance || 0,
          totalSum: responseData.basicStats?.totalSum || 0,
          averageBalance: responseData.basicStats?.averageBalance || 0,
          medianBalance: responseData.basicStats?.medianBalance || 0,
          q1: responseData.basicStats?.q1 || 0,
          q3: responseData.basicStats?.q3 || 0,
          minBalance: responseData.basicStats?.minBalance || 0,
          maxBalance: responseData.basicStats?.maxBalance || 0,
          stdDev: responseData.basicStats?.stdDev || 0,
          iqr: responseData.basicStats?.iqr || 0
        },
        counterAccountAnalysis: (responseData.counterAccounts || []).map((ca: any) => ({
          counterAccount: ca.counterAccount,
          counterAccountName: ca.counterAccountName || 'Ukjent konto',
          transactionCount: ca.transactionCount || 0,
          totalAmount: ca.totalAmount || 0,
          percentage: ca.percentage || 0
        })),
        outlierDetection: {
          outliers: (responseData.outliers || []).map((outlier: any) => ({
            accountNumber: outlier.accountNumber,
            accountName: outlier.accountName || 'Ukjent konto',
            closingBalance: outlier.closingBalance || 0,
            outlierType: outlier.outlierType as 'high' | 'low',
            deviationScore: outlier.zScore || 0
          })),
          outlierThreshold: responseData.basicStats?.iqr ? 1.5 * responseData.basicStats.iqr : 0
        },
        timeSeriesAnalysis: {
          monthlyData: (responseData.timeSeries || []).map((ts: any) => ({
            month: ts.month,
            transactionCount: ts.transactionCount || 0,
            totalAmount: ts.totalAmount || 0
          })),
          trend: responseData.trendAnalysis?.trend || 'insufficient_data',
          seasonality: responseData.trendAnalysis?.seasonality || 'none'
        },
        anomalyDetection: {
          anomalies: (responseData.anomalies || []).map((anomaly: any) => ({
            accountNumber: anomaly.accountNumber,
            accountName: anomaly.accountName || 'Ukjent konto',
            anomalyType: anomaly.anomalyType,
            severity: anomaly.severity as 'high' | 'medium' | 'low',
            description: anomaly.description || 'Ingen beskrivelse'
          })),
          anomalyScore: (responseData.anomalies?.length || 0) / Math.max(responseData.basicStats?.totalAccounts || 1, 1) * 100
        },
        accounts: (responseData.accounts || []).map((acc: any) => ({
          id: acc.id || acc.accountNumber,
          account_number: acc.accountNumber,
          account_name: acc.accountName || 'Ukjent konto',
          closing_balance: acc.closingBalance || 0,
          transaction_count: acc.transactionCount || 0
        })),
        executionTime: responseData.executionTimeMs || 0,
        metadata: {
          clientId,
          fiscalYear,
          selectedStandardNumbers,
          excludedAccountNumbers,
          versionString: responseData.versionId,
          analysisTimestamp: new Date().toISOString(),
          totalRecords: responseData.totalRecords || 0
        }
      };

      // Cache the result if caching is enabled
      if (enableLocalCache) {
        await cacheService.set(cacheKey, result, cacheTimeout);
      }

      console.log(`[PopulationAnalysis] Analysis completed in ${result.executionTime}ms`);
      
      return result;
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0,
    retry: retryOnError ? 3 : false,
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      console.log(`[PopulationAnalysis] Retry ${attemptIndex + 1} in ${delay}ms`);
      return delay;
    },
    staleTime: backgroundRefresh ? cacheTimeout : Infinity,
    gcTime: cacheTimeout * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // Add error boundary
    throwOnError: false,
    meta: {
      errorMessage: 'Feil ved lasting av populasjonsanalyse. Prøv igjen senere.'
    }
  });
}