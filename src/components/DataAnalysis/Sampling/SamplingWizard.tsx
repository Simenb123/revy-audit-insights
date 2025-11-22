import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  TrendingUp, 
  FileSpreadsheet,
  Info,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePopulationCalculator } from '@/hooks/usePopulationCalculator';
import { useDebounce } from '@/hooks/useDebounce';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useTransactions } from '@/hooks/useTransactions';
import { useClientSideSampling } from '@/hooks/useClientSideSampling';
import PopulationAnalysisWithMapping from '@/components/DataAnalysis/PopulationAnalysisWithMapping';
import { PopulationAnalysisErrorBoundary } from '@/components/ErrorBoundary/PopulationAnalysisErrorBoundary';
import { PopulationSelector } from './PopulationSelector';
import { SamplingParametersForm, SamplingParams } from './SamplingParametersForm';
import { SamplingResultsDisplay } from './SamplingResultsDisplay';

interface SamplingWizardProps {
  clientId: string;
  onSampleGenerated?: () => void;
}

interface SamplingResult {
  plan: {
    recommendedSampleSize: number;
    actualSampleSize: number;
    coveragePercentage: number;
    method: string;
    testType: string;
    generatedAt: string;
  };
  sample: Array<{
    id: string;
    transaction_date: string;
    account_no: string;
    account_name: string;
    description: string;
    amount: number;
    risk_score?: number;
  }>;
}

export const SamplingWizard: React.FC<SamplingWizardProps> = ({ 
  clientId,
  onSampleGenerated 
}) => {
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();
  const { selectedFiscalYear } = useFiscalYear();
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SamplingResult | null>(null);
  const [workingMateriality, setWorkingMateriality] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['standardAccounts'])
  );
  
  const [params, setParams] = useState<SamplingParams & { 
    selectedStandardNumbers: string[]; 
    excludedAccountNumbers: string[];
    populationSize: number;
    populationSum: number;
  }>({
    fiscalYear: selectedFiscalYear || new Date().getFullYear(),
    testType: 'SUBSTANTIVE',
    method: 'SRS',
    populationSize: 1000,
    populationSum: 1000000,
    selectedStandardNumbers: [],
    excludedAccountNumbers: [],
    materiality: 50000,
    expectedMisstatement: 5000,
    confidenceLevel: 95,
    riskLevel: 'moderat',
    tolerableDeviationRate: 5,
    expectedDeviationRate: 1,
    useHighRiskInclusion: true
  });

  // Get active trial balance version
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId, selectedFiscalYear);
  
  // Get trial balance data with mappings
  const { data: trialBalanceData } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear, 
    activeTrialBalanceVersion?.version
  );

  // Debounce to prevent race conditions
  const debouncedSelectedStandardNumbers = useDebounce(params.selectedStandardNumbers, 200);
  const debouncedExcludedAccountNumbers = useDebounce(params.excludedAccountNumbers, 200);

  // Calculate population
  const { 
    data: populationData, 
    isLoading: isCalculatingPopulation,
    refetch: refetchPopulation
  } = usePopulationCalculator(
    clientId,
    params.fiscalYear,
    debouncedSelectedStandardNumbers,
    debouncedExcludedAccountNumbers,
    activeTrialBalanceVersion?.version
  );

  // Fetch transactions
  const { 
    data: transactionData, 
    isLoading: isLoadingTransactions 
  } = useTransactions(
    clientId,
    {
      versionId: activeTrialBalanceVersion?.version,
      pageSize: 50000
    }
  );

  // Apply client-side sampling
  const clientSamplingResult = useClientSideSampling(
    transactionData?.transactions,
    {
      method: params.method,
      sampleSize: Math.min(100, Math.ceil((populationData?.size || 0) * 0.05)),
      confidenceLevel: params.confidenceLevel,
      materiality: params.materiality,
      expectedMisstatement: params.expectedMisstatement,
      tolerableDeviationRate: params.tolerableDeviationRate,
      expectedDeviationRate: params.expectedDeviationRate,
      thresholdAmount: params.thresholdAmount,
      useHighRiskInclusion: params.useHighRiskInclusion
    }
  );

  // Update population size and sum
  const populationSize = useMemo(() => populationData?.size || 0, [populationData?.size]);
  const populationSum = useMemo(() => populationData?.sum || 0, [populationData?.sum]);

  useEffect(() => {
    if (populationSize > 0 || populationSum > 0) {
      setParams(prev => ({
        ...prev,
        populationSize,
        populationSum
      }));
    }
  }, [populationSize, populationSum]);

  // Auto-select accounts when standard accounts are selected
  useEffect(() => {
    if (params.selectedStandardNumbers.length > 0 && trialBalanceData?.standardAccountBalances) {
      const accountsToAutoInclude: string[] = [];
      
      params.selectedStandardNumbers.forEach(standardNumber => {
        const standardAccount = trialBalanceData.standardAccountBalances.find(
          balance => balance.standard_number === standardNumber
        );
        
        if (standardAccount) {
          standardAccount.mapped_accounts.forEach(account => {
            if (!accountsToAutoInclude.includes(account.account_number)) {
              accountsToAutoInclude.push(account.account_number);
            }
          });
        }
      });
      
      setParams(prev => ({
        ...prev,
        excludedAccountNumbers: prev.excludedAccountNumbers.filter(
          accountNumber => !accountsToAutoInclude.includes(accountNumber)
        )
      }));
    }
  }, [params.selectedStandardNumbers, trialBalanceData?.standardAccountBalances]);

  // Fetch materiality
  useEffect(() => {
    const fetchMateriality = async () => {
      if (!clientId || !params.fiscalYear) return;
      
      try {
        const { data } = await supabase
          .from('materiality_settings')
          .select('working_materiality')
          .eq('client_id', clientId)
          .eq('fiscal_year', params.fiscalYear)
          .maybeSingle();

        if (data?.working_materiality) {
          setWorkingMateriality(data.working_materiality);
          setParams(prev => ({ 
            ...prev, 
            materiality: data.working_materiality 
          }));
        }
      } catch (error) {
        // Silent error
      }
    };

    fetchMateriality();
  }, [clientId, params.fiscalYear]);

  // Update fiscal year when context changes
  useEffect(() => {
    if (selectedFiscalYear && selectedFiscalYear !== params.fiscalYear) {
      setParams(prev => ({ ...prev, fiscalYear: selectedFiscalYear }));
    }
  }, [selectedFiscalYear, params.fiscalYear]);

  const handleParamChange = (key: keyof SamplingParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleStandardNumbersChange = (numbers: string[]) => {
    setParams(prev => ({ ...prev, selectedStandardNumbers: numbers }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const generateSample = async () => {
    if (!clientSamplingResult) {
      toast({
        title: "Ingen data tilgjengelig",
        description: "Kan ikke generere utvalg uten transaksjondata",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const timestamp = new Date().toLocaleString('nb-NO', { 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const methodName = params.method === 'SRS' ? 'SRS' : 
                        params.method === 'MUS' ? 'MUS' : 
                        params.method === 'SYSTEMATIC' ? 'Systematisk' : 
                        params.method;
      const autoName = `${methodName} ${timestamp}`;

      // Save to database
      const { error: saveError } = await supabase
        .from('audit_sampling_plans')
        .insert({
          client_id: clientId,
          fiscal_year: params.fiscalYear,
          test_type: params.testType,
          method: params.method,
          population_size: populationSize,
          population_sum: populationSum,
          materiality: params.materiality,
          expected_misstatement: params.expectedMisstatement,
          confidence_level: params.confidenceLevel,
          risk_level: params.riskLevel,
          tolerable_deviation_rate: params.tolerableDeviationRate,
          expected_deviation_rate: params.expectedDeviationRate,
          threshold_amount: params.thresholdAmount,
          recommended_sample_size: clientSamplingResult.plan.recommendedSampleSize,
          actual_sample_size: clientSamplingResult.plan.actualSampleSize,
          coverage_percentage: clientSamplingResult.plan.coveragePercentage,
          plan_name: autoName,
          metadata: {
            selected_standard_numbers: params.selectedStandardNumbers,
            excluded_account_numbers: params.excludedAccountNumbers,
            version_id: activeTrialBalanceVersion?.version
          }
        });

      if (saveError) throw saveError;

      // Set result
      setResult({
        plan: {
          recommendedSampleSize: clientSamplingResult.plan.recommendedSampleSize,
          actualSampleSize: clientSamplingResult.plan.actualSampleSize,
          coveragePercentage: clientSamplingResult.plan.coveragePercentage,
          method: clientSamplingResult.plan.method,
          testType: params.testType,
          generatedAt: clientSamplingResult.plan.generatedAt
        },
        sample: clientSamplingResult.sample.map(tx => ({
          id: tx.id,
          transaction_date: tx.transaction_date,
          account_no: tx.account_number,
          account_name: tx.account_name || '',
          description: tx.description,
          amount: Math.abs(tx.net_amount || 0),
          risk_score: tx.net_amount && Math.abs(tx.net_amount) > (params.thresholdAmount || 10000) ? 0.8 : 0.3
        }))
      });
      
      createAuditLog.mutate({
        clientId,
        actionType: 'analysis_performed',
        areaName: 'sampling',
        description: `Utvalg generert og lagret: ${autoName}`,
        metadata: {
          test_type: params.testType,
          method: params.method,
          sample_size: clientSamplingResult.plan.actualSampleSize,
          coverage_percentage: clientSamplingResult.plan.coveragePercentage,
        }
      });
      
      toast({
        title: "Utvalg generert og lagret",
        description: `${clientSamplingResult.plan.actualSampleSize} transaksjoner valgt med ${clientSamplingResult.plan.coveragePercentage.toFixed(1)}% dekning`,
      });

      if (onSampleGenerated) {
        onSampleGenerated();
      }

    } catch (error: any) {
      toast({
        title: "Feil ved generering",
        description: error.message || "Kunne ikke generere utvalg",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <PopulationAnalysisErrorBoundary onRetry={() => {
      refetchPopulation();
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Revisjonsutvalg</h2>
          <div className="ml-auto flex items-center gap-4">
            {workingMateriality && (
              <Badge variant="outline">
                Arbeidsvesentlighet: {formatCurrency(workingMateriality)}
              </Badge>
            )}
            {populationData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                {populationData.size} kontoer • {formatCurrency(populationData.sum)}
              </div>
            )}
          </div>
        </div>

        {/* Population Warning */}
        {populationData && (populationData.isEmpty || populationData.size === 0) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                {populationData?.emptyReason === 'no_standard_accounts' && (
                  <div>
                    <strong>Ingen regnskapslinjer valgt:</strong> Velg en eller flere regnskapslinjer nedenfor.
                  </div>
                )}
                {populationData?.emptyReason === 'no_matching_accounts' && "Ingen kontoer matcher de valgte regnskapslinjene."}
                {populationData?.emptyReason === 'zero_balances' && "Alle kontoer har nullsaldo for det valgte året."}
                {populationData?.emptyReason === 'all_excluded' && "Alle relevante kontoer er ekskludert fra utvalget."}
                {populationData?.metadata?.hasDataForYear === false && (
                  <div>
                    <strong>Ingen data for {params.fiscalYear}:</strong> Regnskapsdata mangler for det valgte året.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Population Analysis */}
        <PopulationAnalysisWithMapping
          clientId={clientId}
          fiscalYear={params.fiscalYear}
          selectedStandardNumbers={debouncedSelectedStandardNumbers}
          excludedAccountNumbers={debouncedExcludedAccountNumbers}
          versionKey={activeTrialBalanceVersion?.version}
        />

        {/* Step 1: Population Selection */}
        <PopulationSelector
          selectedStandardNumbers={params.selectedStandardNumbers}
          onSelectionChange={handleStandardNumbersChange}
          isExpanded={expandedSections.has('standardAccounts')}
          onToggleExpand={() => toggleSection('standardAccounts')}
        />

        {/* Step 2: Parameters */}
        {params.selectedStandardNumbers.length > 0 && (
          <SamplingParametersForm
            params={params}
            onChange={handleParamChange}
          />
        )}

        {/* Step 3: Generate */}
        {params.selectedStandardNumbers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Generering og Resultat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={generateSample}
                  disabled={isLoading || isCalculatingPopulation || isLoadingTransactions || !clientSamplingResult}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Genererer...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Generer utvalg
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Populasjon: {formatCurrency(populationSum)} ({populationSize} kontoer)
                </div>
              </div>

              {result && (
                <SamplingResultsDisplay
                  plan={result.plan}
                  sample={result.sample}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PopulationAnalysisErrorBoundary>
  );
};
