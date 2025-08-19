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
import { useToast } from '@/hooks/use-toast';
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
  Search,
  Filter
} from 'lucide-react';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePopulationCalculator, PopulationAccount } from '@/hooks/usePopulationCalculator';
import { useActiveTrialBalanceVersion } from '@/hooks/useTrialBalanceVersions';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';

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

const ConsolidatedAuditSampling: React.FC<ConsolidatedAuditSamplingProps> = ({ clientId }) => {
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();
  const { selectedFiscalYear } = useFiscalYear();
  
  // Get active trial balance version
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId);
  
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
  
  const [params, setParams] = useState<SamplingParams>({
    fiscalYear: selectedFiscalYear || new Date().getFullYear(),
    testType: 'SUBSTANTIVE',
    method: 'MUS',
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
    error: populationError 
  } = usePopulationCalculator(
    clientId,
    params.fiscalYear,
    params.selectedStandardNumbers,
    params.excludedAccountNumbers,
    activeTrialBalanceVersion?.version
  );

  // Auto-select trial balance accounts when standard accounts are selected
  useEffect(() => {
    if (params.selectedStandardNumbers.length > 0 && trialBalanceData?.standardAccountBalances) {
      // Find all trial balance accounts that belong to selected standard accounts
      const accountsToAutoSelect: string[] = [];
      
      params.selectedStandardNumbers.forEach(standardNumber => {
        const standardAccount = trialBalanceData.standardAccountBalances.find(
          balance => balance.standard_number === standardNumber
        );
        
        if (standardAccount) {
          standardAccount.mapped_accounts.forEach(account => {
            if (!accountsToAutoSelect.includes(account.account_number)) {
              accountsToAutoSelect.push(account.account_number);
            }
          });
        }
      });
      
      // Remove auto-selected accounts from excluded list (they should be included by default)
      setParams(prev => ({
        ...prev,
        excludedAccountNumbers: prev.excludedAccountNumbers.filter(
          accountNumber => !accountsToAutoSelect.includes(accountNumber)
        )
      }));
    }
  }, [params.selectedStandardNumbers, trialBalanceData?.standardAccountBalances]);

  // Get accounts for the exclusion manager
  const accountsForExclusion = useMemo(() => {
    if (!populationData?.accounts) return [];
    
    // Filter accounts based on search and exclusion status
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
          console.warn('Could not fetch materiality settings:', error);
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
        console.error('Error fetching materiality:', error);
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
  useEffect(() => {
    if (populationData) {
      setParams(prev => ({
        ...prev,
        populationSize: populationData.size,
        populationSum: populationData.sum
      }));
    }
  }, [populationData]);

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

  const handleSelectAllFilteredAccounts = () => {
    const allFilteredAccountNumbers = accountsForExclusion.map(acc => acc.account_number);
    const newExcluded = [...new Set([...params.excludedAccountNumbers, ...allFilteredAccountNumbers])];
    handleParamChange('excludedAccountNumbers', newExcluded);
  };

  const handleDeselectAllFilteredAccounts = () => {
    const filteredAccountNumbers = accountsForExclusion.map(acc => acc.account_number);
    const newExcluded = params.excludedAccountNumbers.filter(n => !filteredAccountNumbers.includes(n));
    handleParamChange('excludedAccountNumbers', newExcluded);
  };

  const handleClearAllExclusions = () => {
    handleParamChange('excludedAccountNumbers', []);
  };

  const addQuickCombination = (numbers: string[]) => {
    const newSelection = [...new Set([...params.selectedStandardNumbers, ...numbers])];
    handleParamChange('selectedStandardNumbers', newSelection);
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
    setIsLoading(true);
    try {
      const payload = {
        clientId,
        ...params,
        strataBounds: params.strataBounds ? 
          params.strataBounds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) : 
          undefined
      };

      const { data, error } = await supabase.functions.invoke('audit-sampling', {
        body: payload
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Utvalg generert",
        description: `${data.plan.actualSampleSize} transaksjoner valgt med ${data.plan.coveragePercentage.toFixed(1)}% dekning`
      });

    } catch (error) {
      console.error('Sampling error:', error);
      toast({
        title: "Feil ved generering",
        description: error.message || "Kunne ikke generere utvalg",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePlan = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      const payload = {
        clientId,
        ...params,
        strataBounds: params.strataBounds ? 
          params.strataBounds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) : 
          undefined,
        save: true
      };

      const { error } = await supabase.functions.invoke('audit-sampling', {
        body: payload
      });

      if (error) throw error;

      createAuditLog.mutate({
        clientId,
        actionType: 'analysis_performed',
        areaName: 'sampling',
        description: `Utvalgsplan lagret: ${result.plan.method} metode, ${result.plan.actualSampleSize} elementer`,
        metadata: {
          test_type: result.plan.testType,
          method: result.plan.method,
          sample_size: result.plan.actualSampleSize,
          coverage_percentage: result.plan.coveragePercentage
        }
      });

      toast({
        title: "Plan lagret",
        description: "Utvalgsplanen er lagret i databasen"
      });

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message || "Kunne ikke lagre plan",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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

  // Calculate impact statistics for excluded accounts
  const includedAccounts = populationData?.accounts?.filter(acc => !params.excludedAccountNumbers.includes(acc.account_number)) || [];
  const excludedAccounts = populationData?.accounts?.filter(acc => params.excludedAccountNumbers.includes(acc.account_number)) || [];
  const includedSum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
  const excludedSum = excludedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
  const totalSum = includedSum + excludedSum;

  return (
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

      <div className="grid gap-6">
        {/* Population Section */}
        <Card>
          <Collapsible open={expandedSections.has('population')} onOpenChange={() => toggleSection('population')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                  {expandedSections.has('population') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Database className="h-4 w-4" />
                  Populasjonsvalg
                  {params.selectedStandardNumbers.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {params.selectedStandardNumbers.length} valgt
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Velg regnskapslinjer - kontoer blir automatisk valgt
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Quick Combinations */}
                <div>
                  <Label className="text-sm font-medium">Vanlige kombinasjoner</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addQuickCombination(['10', '19'])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Salgsinntekter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addQuickCombination(['20', '70'])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Varekost + Annen drift
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addQuickCombination(['30'])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Lønnskostnader
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Standard Account Selection */}
                <div>
                  <Label className="text-sm font-medium">Regnskapslinjer</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {COMMON_STANDARD_ACCOUNTS.map((account) => {
                      const isSelected = params.selectedStandardNumbers.includes(account.number);
                      const standardBalance = trialBalanceData?.standardAccountBalances.find(
                        balance => balance.standard_number === account.number
                      );
                      
                      return (
                        <div 
                          key={account.number} 
                          className={`flex items-center space-x-2 p-3 rounded-lg border ${
                            isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            id={`account-${account.number}`}
                            checked={isSelected}
                            onCheckedChange={() => handleStandardAccountToggle(account.number)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={`account-${account.number}`}
                              className="text-sm cursor-pointer font-medium"
                            >
                              <span className="font-mono">{account.number}</span>
                              <span className="ml-2">{account.name}</span>
                            </Label>
                            {standardBalance && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {standardBalance.mapped_accounts.length} kontoer • {formatCurrency(standardBalance.total_balance)}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {account.category}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Accounts Summary */}
                {params.selectedStandardNumbers.length > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">Valgte regnskapslinjer</div>
                    <div className="flex gap-1 flex-wrap">
                      {params.selectedStandardNumbers.map((number) => {
                        const account = COMMON_STANDARD_ACCOUNTS.find(a => a.number === number);
                        return (
                          <Badge key={number} variant="secondary" className="gap-1">
                            <span className="font-mono">{number}</span>
                            {account && <span>{account.name}</span>}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive" 
                              onClick={() => handleStandardAccountToggle(number)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Population Statistics */}
                {isCalculatingPopulation ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calculator className="h-4 w-4 animate-spin" />
                      <span>Beregner populasjon...</span>
                    </div>
                  </div>
                ) : populationData && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-sm font-medium mb-2">Populasjonsstatistikk</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Inkluderte kontoer</div>
                        <div className="text-lg font-semibold text-primary">{includedAccounts.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Total beløp</div>
                        <div className="text-lg font-semibold">{formatCurrency(includedSum)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Dekning</div>
                        <div className="text-lg font-semibold">
                          {totalSum > 0 ? ((includedSum / totalSum) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    {params.excludedAccountNumbers.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="text-destructive font-medium">{params.excludedAccountNumbers.length} kontoer ekskludert</span>
                        <span className="ml-2">({formatCurrency(excludedSum)})</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Account Exclusion Section */}
        {params.selectedStandardNumbers.length > 0 && populationData?.accounts && (
          <Card>
            <Collapsible open={expandedSections.has('accounts')} onOpenChange={() => toggleSection('accounts')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    {expandedSections.has('accounts') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Filter className="h-4 w-4" />
                    Kontobehandling
                    {params.excludedAccountNumbers.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {params.excludedAccountNumbers.length} ekskludert
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Administrer hvilke kontoer som skal inkluderes i utvalget
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Impact Summary */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Inkludert</div>
                      <div className="font-semibold">{includedAccounts.length} kontoer</div>
                      <div className="text-sm">{formatCurrency(includedSum)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Ekskludert</div>
                      <div className="font-semibold text-muted-foreground">{excludedAccounts.length} kontoer</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(excludedSum)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Dekning</div>
                      <div className="font-semibold">
                        {totalSum > 0 ? ((includedSum / totalSum) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Søk etter kontonummer eller navn..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant={showOnlyExcluded ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowOnlyExcluded(!showOnlyExcluded)}
                    >
                      {showOnlyExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {showOnlyExcluded ? 'Alle' : 'Kun eksklud.'}
                    </Button>
                  </div>

                  {/* Batch Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAllFilteredAccounts}>
                      Velg alle ({accountsForExclusion.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAllFilteredAccounts}>
                      Fjern valgte
                    </Button>
                    {params.excludedAccountNumbers.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleClearAllExclusions}>
                        Nullstill alle
                      </Button>
                    )}
                  </div>

                  {/* Accounts List */}
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Kontoer ({accountsForExclusion.length} av {populationData.accounts.length})
                    </div>
                    
                    <ScrollArea className="h-64 border rounded-md">
                      <div className="p-2 space-y-2">
                        {accountsForExclusion.map((account) => {
                          const isExcluded = params.excludedAccountNumbers.includes(account.account_number);
                          
                          return (
                            <div
                              key={account.id}
                              className={`flex items-center space-x-3 p-3 rounded-md transition-all duration-200 cursor-pointer hover:bg-muted/50 ${
                                isExcluded ? 'bg-destructive/10 border border-destructive/20' : 'hover:border-border border border-transparent'
                              }`}
                              onClick={() => handleAccountExclusionToggle(account.account_number)}
                            >
                              <Checkbox
                                checked={isExcluded}
                                onCheckedChange={() => handleAccountExclusionToggle(account.account_number)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm font-medium">
                                    {account.account_number}
                                  </span>
                                  <span className={`text-sm truncate ${isExcluded ? 'text-muted-foreground line-through' : ''}`}>
                                    {account.account_name}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${isExcluded ? 'text-muted-foreground' : ''}`}>
                                  {formatCurrency(Math.abs(account.closing_balance))}
                                </div>
                                {isExcluded && (
                                  <Badge variant="destructive" className="text-xs">
                                    Ekskludert
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {accountsForExclusion.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchTerm || showOnlyExcluded 
                              ? 'Ingen kontoer matcher filteret' 
                              : 'Ingen kontoer tilgjengelig'}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Parameters Section */}
        <Card>
          <Collapsible open={expandedSections.has('parameters')} onOpenChange={() => toggleSection('parameters')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                  {expandedSections.has('parameters') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Settings className="h-4 w-4" />
                  Utvalgsparametere
                </CardTitle>
                <CardDescription>
                  Konfigurer parametere for generering av revisjonsutvalg
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testType">Testtype</Label>
                    <Select value={params.testType} onValueChange={(value) => handleParamChange('testType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBSTANTIVE">Substans (Detaljkontroll)</SelectItem>
                        <SelectItem value="CONTROL">Test av kontroll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="method">Utvalgsmetode</Label>
                    <Select value={params.method} onValueChange={(value) => handleParamChange('method', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SRS">Tilfeldig utvalg (SRS)</SelectItem>
                        <SelectItem value="SYSTEMATIC">Systematisk utvalg</SelectItem>
                        <SelectItem value="MUS">Pengeenhetsutvalg (MUS)</SelectItem>
                        <SelectItem value="STRATIFIED">Stratifisert utvalg</SelectItem>
                        <SelectItem value="THRESHOLD">Terskelutvalg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  <div>
                    <Label htmlFor="riskLevel">Risikonivå</Label>
                    <Select value={params.riskLevel} onValueChange={(value) => handleParamChange('riskLevel', value)}>
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
                </div>

                {params.testType === 'SUBSTANTIVE' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="materiality">Arbeidsvesentlighet (NOK)</Label>
                      <Input
                        id="materiality"
                        type="number"
                        value={params.materiality || ''}
                        onChange={(e) => handleParamChange('materiality', parseFloat(e.target.value))}
                        className={workingMateriality ? "bg-muted" : ""}
                      />
                      {workingMateriality && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Hentet fra klientens materialitetsinnstillinger
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="expectedMisstatement">Forventet feil (NOK)</Label>
                      <Input
                        id="expectedMisstatement"
                        type="number"
                        value={params.expectedMisstatement || ''}
                        onChange={(e) => handleParamChange('expectedMisstatement', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Generation and Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Generering og Resultat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generation Controls */}
            <div className="flex gap-2">
              <Button 
                onClick={generateSample} 
                disabled={isLoading || params.selectedStandardNumbers.length === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Calculator className="mr-2 h-4 w-4 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generer utvalg
                  </>
                )}
              </Button>
              
              {result && (
                <Button onClick={savePlan} disabled={isSaving} variant="outline">
                  {isSaving ? (
                    <>
                      <Calculator className="mr-2 h-4 w-4 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lagre plan
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Help Text */}
            {params.selectedStandardNumbers.length === 0 && (
              <div className="p-3 bg-muted/50 border border-dashed border-muted-foreground/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Velg minst én regnskapslinje for å generere utvalg</span>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Utvalgsplan</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Metode</div>
                      <div className="font-medium">{result.plan.method}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Utvalg størrelse</div>
                      <div className="font-medium">{result.plan.actualSampleSize}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Dekning</div>
                      <div className="font-medium">{result.plan.coveragePercentage.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Generert</div>
                      <div className="font-medium">{formatDate(result.plan.generatedAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Sample Preview */}
                {result.sample && result.sample.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Utvalgte transaksjoner (første 10)</h4>
                    <ScrollArea className="h-64 border rounded-md">
                      <div className="p-2">
                        {result.sample.slice(0, 10).map((transaction, index) => (
                          <div key={transaction.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <div className="flex-1">
                              <div className="font-mono text-sm">{transaction.account_no}</div>
                              <div className="text-sm text-muted-foreground">{transaction.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(transaction.transaction_date)}</div>
                            </div>
                          </div>
                        ))}
                        {result.sample.length > 10 && (
                          <div className="text-center p-2 text-sm text-muted-foreground">
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
    </div>
  );
};

export default ConsolidatedAuditSampling;