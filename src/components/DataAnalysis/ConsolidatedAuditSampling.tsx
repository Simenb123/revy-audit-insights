import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Save, 
  TrendingUp, 
  Database, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Plus,
  Calculator,
  FileSpreadsheet,
  Info,
  RefreshCw,
  Search,
  Filter,
  Archive,
  History,
  AlertTriangle
} from 'lucide-react';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePopulationCalculator, PopulationAccount } from '@/hooks/usePopulationCalculator';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import SavedSamplesManager from './SavedSamplesManager';
import PopulationInsights from './PopulationInsights';
import { PopulationAnalysisErrorBoundary } from '@/components/ErrorBoundary/PopulationAnalysisErrorBoundary';

interface ConsolidatedAuditSamplingProps {
  clientId: string;
}

interface SamplingParams {
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED' | 'THRESHOLD';
  populationSize: number;
  populationSum: number;
  selectedStandardNumbers: string[];
  excludedAccountNumbers: string[];
  materiality?: number;
  expectedMisstatement?: number;
  confidenceLevel: number;
  riskLevel: 'lav' | 'moderat' | 'hoy';
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  strataBounds?: string;
  thresholdAmount?: number;
  seed?: number;
  useHighRiskInclusion: boolean;
}

interface Transaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  risk_score?: number;
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
  sample: Transaction[];
}

// Common standard accounts for audit sampling
const COMMON_STANDARD_ACCOUNTS = [
  { number: '10', name: 'Salgsinntekter', category: 'Inntekt' },
  { number: '19', name: 'Sum driftsinntekter', category: 'Inntekt' },
  { number: '20', name: 'Varekostnad', category: 'Kostnad' },
  { number: '70', name: 'Annen driftskostnad', category: 'Kostnad' },
  { number: '30', name: 'Lønn og sosiale kostnader', category: 'Kostnad' },
  { number: '40', name: 'Avskrivninger', category: 'Kostnad' },
  { number: '50', name: 'Nedskrivninger', category: 'Kostnad' },
  { number: '60', name: 'Andre driftskostnader', category: 'Kostnad' },
  { number: '80', name: 'Finansinntekter', category: 'Finans' },
  { number: '81', name: 'Finanskostnader', category: 'Finans' },
];

const ConsolidatedAuditSampling: React.FC<ConsolidatedAuditSamplingProps> = React.memo(({ clientId }) => {
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();
  const { selectedFiscalYear } = useFiscalYear();
  
  // Get active trial balance version
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId, selectedFiscalYear);
  
  // Get trial balance data with mappings for auto-selection
  const { data: trialBalanceData } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear, 
    activeTrialBalanceVersion?.version
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<SamplingResult | null>(null);
  const [workingMateriality, setWorkingMateriality] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyExcluded, setShowOnlyExcluded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['population', 'accounts']));
  const [analysisLevel, setAnalysisLevel] = useState<'account' | 'statement_line'>('account');
  
  const [params, setParams] = useState<SamplingParams>({
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

  // Hook for calculating population from accounting data
  const { 
    data: populationData, 
    isLoading: isCalculatingPopulation,
    error: populationError,
    refetch: refetchPopulation
  } = usePopulationCalculator(
    clientId,
    params.fiscalYear,
    params.selectedStandardNumbers,
    params.excludedAccountNumbers,
    activeTrialBalanceVersion?.version
  );

  // Query for saved samples
  const { data: savedSamples, refetch: refetchSavedSamples } = useQuery({
    queryKey: ['saved-audit-samples', clientId, params.fiscalYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_sampling_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('fiscal_year', params.fiscalYear)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  // Auto-select trial balance accounts when standard accounts are selected
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
      
      // Remove auto-selected accounts from excluded list
      setParams(prev => ({
        ...prev,
        excludedAccountNumbers: prev.excludedAccountNumbers.filter(
          accountNumber => !accountsToAutoInclude.includes(accountNumber)
        )
      }));
    }
  }, [params.selectedStandardNumbers, trialBalanceData?.standardAccountBalances]);

  // Fetch working materiality on component mount and when fiscal year changes
  useEffect(() => {
    const fetchMateriality = async () => {
      if (!clientId || !params.fiscalYear) return;
      
      try {
        const { data, error } = await supabase
          .from('materiality_settings')
          .select('working_materiality')
          .eq('client_id', clientId)
          .eq('fiscal_year', params.fiscalYear)
          .maybeSingle();

        if (error) {
          return;
        }

        if (data?.working_materiality) {
          setWorkingMateriality(data.working_materiality);
          setParams(prev => ({ 
            ...prev, 
            materiality: data.working_materiality 
          }));
        }
      } catch (error) {
        // Silent error handling for materiality fetch
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

  // Update population size and sum when population data changes
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

  const handleParamChange = (key: keyof SamplingParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleStandardAccountToggle = (accountNumber: string) => {
    const isSelected = params.selectedStandardNumbers.includes(accountNumber);
    if (isSelected) {
      handleParamChange('selectedStandardNumbers', params.selectedStandardNumbers.filter(n => n !== accountNumber));
    } else {
      handleParamChange('selectedStandardNumbers', [...params.selectedStandardNumbers, accountNumber]);
    }
  };

  const handleAccountExclusionToggle = (accountNumber: string) => {
    const isExcluded = params.excludedAccountNumbers.includes(accountNumber);
    if (isExcluded) {
      handleParamChange('excludedAccountNumbers', params.excludedAccountNumbers.filter(n => n !== accountNumber));
    } else {
      handleParamChange('excludedAccountNumbers', [...params.excludedAccountNumbers, accountNumber]);
    }
  };

  const generateSample = async () => {
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

      const payload = {
        clientId,
        ...params,
        versionId: activeTrialBalanceVersion?.version,
        planName: autoName,
        strataBounds: params.strataBounds ? 
          params.strataBounds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) : 
          undefined,
        save: true
      };

      const { data, error } = await supabase.functions.invoke('audit-sampling', {
        body: payload
      });

      if (error) throw error;

      setResult(data);
      
      createAuditLog.mutate({
        clientId,
        actionType: 'analysis_performed',
        areaName: 'sampling',
        description: `Utvalg generert og lagret: ${autoName}`,
        metadata: {
          test_type: data.plan.testType,
          method: data.plan.method,
          sample_size: data.plan.actualSampleSize,
          coverage_percentage: data.plan.coveragePercentage,
          auto_saved: true
        }
      });
      
      toast({
        title: "Utvalg generert og lagret",
        description: `${data.plan.actualSampleSize} transaksjoner valgt med ${data.plan.coveragePercentage.toFixed(1)}% dekning`,
      });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
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

  // Get accounts for the exclusion manager
  const accountsForExclusion = useMemo(() => {
    if (!populationData?.accounts) return [];
    
    let filtered = populationData.accounts;
    
    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (showOnlyExcluded) {
      filtered = filtered.filter(account => 
        params.excludedAccountNumbers.includes(account.account_number)
      );
    }
    
    return filtered.sort((a, b) => a.account_number.localeCompare(b.account_number));
  }, [populationData?.accounts, searchTerm, showOnlyExcluded, params.excludedAccountNumbers]);

  return (
    <PopulationAnalysisErrorBoundary onRetry={() => {
      refetchPopulation();
      refetchSavedSamples();
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

        {/* Main Content with Tabs */}
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Generer utvalg
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Lagrede utvalg
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="mt-6">
            <div className="space-y-6">
              <PopulationInsights
                clientId={clientId}
                fiscalYear={params.fiscalYear}
                selectedStandardNumbers={params.selectedStandardNumbers}
                excludedAccountNumbers={params.excludedAccountNumbers}
                versionString={activeTrialBalanceVersion?.version}
                analysisLevel={analysisLevel}
                onAnalysisLevelChange={setAnalysisLevel}
              />

              {/* Standard Account Selection */}
              <Card>
                <Collapsible open={expandedSections.has('standardAccounts')} onOpenChange={() => toggleSection('standardAccounts')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Regnskapslinjer ({params.selectedStandardNumbers.length} valgt)
                        </span>
                        {expandedSections.has('standardAccounts') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                      <CardDescription>
                        Velg hvilke regnskapslinjer som skal inngå i utvalget
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Quick Selection Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleParamChange('selectedStandardNumbers', ['20'])}
                        >
                          Kun Varekostnad
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleParamChange('selectedStandardNumbers', ['20', '70'])}
                        >
                          Varekost + Annen drift
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleParamChange('selectedStandardNumbers', ['10', '19'])}
                        >
                          Salgsinntekter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleParamChange('selectedStandardNumbers', [])}
                        >
                          Nullstill
                        </Button>
                      </div>

                      <Separator />

                      {/* Standard Account Grid */}
                      <div className="grid gap-2">
                        {COMMON_STANDARD_ACCOUNTS.map((account) => (
                          <div
                            key={account.number}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`standard-${account.number}`}
                                checked={params.selectedStandardNumbers.includes(account.number)}
                                onCheckedChange={() => handleStandardAccountToggle(account.number)}
                              />
                              <div>
                                <label
                                  htmlFor={`standard-${account.number}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {account.number} - {account.name}
                                </label>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {account.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Sampling Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Utvalgsparametere
                  </CardTitle>
                  <CardDescription>
                    Konfigurer parametere for utvalgsgenereringen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testType">Testtype</Label>
                      <Select value={params.testType} onValueChange={(value: 'SUBSTANTIVE' | 'CONTROL') => handleParamChange('testType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUBSTANTIVE">Substanstest</SelectItem>
                          <SelectItem value="CONTROL">Kontrolltest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="method">Utvalgsmetode</Label>
                      <Select value={params.method} onValueChange={(value: any) => handleParamChange('method', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SRS">Tilfeldig utvalg (SRS)</SelectItem>
                          <SelectItem value="SYSTEMATIC">Systematisk utvalg</SelectItem>
                          <SelectItem value="MUS">Monetær enhetsutvalg (MUS)</SelectItem>
                          <SelectItem value="STRATIFIED">Stratifisert utvalg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confidenceLevel">Konfidensnivå (%)</Label>
                      <Select value={params.confidenceLevel.toString()} onValueChange={(value) => handleParamChange('confidenceLevel', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90">90%</SelectItem>
                          <SelectItem value="95">95%</SelectItem>
                          <SelectItem value="99">99%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="materiality">Vesentlighet (NOK)</Label>
                      <Input
                        id="materiality"
                        type="number"
                        value={params.materiality || ''}
                        onChange={(e) => handleParamChange('materiality', parseFloat(e.target.value) || 0)}
                        placeholder="50000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="riskLevel">Risikonivå</Label>
                      <Select value={params.riskLevel} onValueChange={(value: 'lav' | 'moderat' | 'hoy') => handleParamChange('riskLevel', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lav">Lav</SelectItem>
                          <SelectItem value="moderat">Moderat</SelectItem>
                          <SelectItem value="hoy">Høy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {params.testType === 'CONTROL' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="tolerableDeviationRate">Tolerabel avvikssats (%)</Label>
                          <Input
                            id="tolerableDeviationRate"
                            type="number"
                            value={params.tolerableDeviationRate || ''}
                            onChange={(e) => handleParamChange('tolerableDeviationRate', parseFloat(e.target.value) || 0)}
                            placeholder="5"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expectedDeviationRate">Forventet avvikssats (%)</Label>
                          <Input
                            id="expectedDeviationRate"
                            type="number"
                            value={params.expectedDeviationRate || ''}
                            onChange={(e) => handleParamChange('expectedDeviationRate', parseFloat(e.target.value) || 0)}
                            placeholder="1"
                            min="0"
                            max="100"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generation and Results */}
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
                      disabled={isLoading || params.selectedStandardNumbers.length === 0}
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
                    <div className="space-y-4">
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                          <div className="text-2xl font-bold">{result.plan.actualSampleSize}</div>
                          <div className="text-sm text-muted-foreground">Utvalgte transaksjoner</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">{result.plan.coveragePercentage.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">Dekningsgrad</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">{result.plan.method}</div>
                          <div className="text-sm text-muted-foreground">Metode</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">{formatDate(result.plan.generatedAt)}</div>
                          <div className="text-sm text-muted-foreground">Generert</div>
                        </Card>
                      </div>

                      {result.sample.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Utvalgte transaksjoner (viser første 10):</h4>
                          <ScrollArea className="h-64 w-full border rounded">
                            <div className="space-y-1 p-2">
                              {result.sample.slice(0, 10).map((transaction, index) => (
                                <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded text-sm">
                                  <div>
                                    <span className="font-mono">{transaction.account_no}</span> - {transaction.account_name}
                                  </div>
                                  <div className="text-right">
                                    <div>{formatCurrency(transaction.amount)}</div>
                                    <div className="text-xs text-muted-foreground">{formatDate(transaction.transaction_date)}</div>
                                  </div>
                                </div>
                              ))}
                              {result.sample.length > 10 && (
                                <div className="text-center text-sm text-muted-foreground py-2">
                                  ... og {result.sample.length - 10} flere transaksjoner
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {populationError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="text-sm text-destructive">
                        Feil ved beregning av populasjon: {populationError.message}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedSamplesManager clientId={clientId} />
          </TabsContent>
        </Tabs>
      </div>
    </PopulationAnalysisErrorBoundary>
  );
});

export default ConsolidatedAuditSampling;