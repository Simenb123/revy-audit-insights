import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, TrendingUp, Filter, X } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { usePopulationAnalysis } from '@/hooks/usePopulationAnalysis';
import { useActiveTrialBalanceVersion } from '@/hooks/useTrialBalanceVersions';
import { formatCurrency, formatNumber } from '@/services/sampling/utils';
import PopulationAnalysisSection from './PopulationAnalysisSection';

interface PopulationSelectorProps {
  clientId: string;
}

const PopulationSelector: React.FC<PopulationSelectorProps> = ({ clientId }) => {
  const { selectedFiscalYear } = useFiscalYear();
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId);

  const [selectedStandardNumbers, setSelectedStandardNumbers] = useState<string[]>([]);
  const [excludedAccountNumbers, setExcludedAccountNumbers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyExcluded, setShowOnlyExcluded] = useState(false);

  // Get comprehensive population analysis data
  const { 
    data: populationData, 
    isLoading: isCalculatingPopulation,
    error: populationError 
  } = usePopulationAnalysis(
    clientId,
    selectedFiscalYear,
    selectedStandardNumbers,
    excludedAccountNumbers,
    activeTrialBalanceVersion?.version
  );

  // Create stable reference to account numbers to prevent infinite re-renders
  const populationAccountNumbers = useMemo(() => 
    populationData?.accounts?.map(acc => acc.account_number) || [],
    [populationData?.accounts?.length] // Only depend on length for stability
  );

  // Auto-include accounts when standard accounts are selected
  useEffect(() => {
    if (selectedStandardNumbers.length > 0 && populationAccountNumbers.length > 0) {
      setExcludedAccountNumbers(prev => {
        // Remove any accounts from exclusion list that are now part of the population
        const newExcluded = prev.filter(accountNumber => !populationAccountNumbers.includes(accountNumber));
        return newExcluded;
      });
    } else if (selectedStandardNumbers.length === 0) {
      setExcludedAccountNumbers([]);
    }
  }, [selectedStandardNumbers, populationAccountNumbers]);

  const handleStandardAccountToggle = (accountNumber: string) => {
    setSelectedStandardNumbers(prev => 
      prev.includes(accountNumber)
        ? prev.filter(n => n !== accountNumber)
        : [...prev, accountNumber]
    );
  };

  const handleAccountExclusionToggle = (accountNumber: string) => {
    setExcludedAccountNumbers(prev =>
      prev.includes(accountNumber)
        ? prev.filter(n => n !== accountNumber)
        : [...prev, accountNumber]
    );
  };

  const filteredAccounts = populationData?.accounts?.filter(account => {
    const matchesSearch = !searchTerm || 
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !showOnlyExcluded || 
      excludedAccountNumbers.includes(account.account_number);
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Common standard accounts for quick selection
  const commonStandardAccounts = [
    { number: '10', name: 'Salgsinntekter', category: 'Inntekt' },
    { number: '19', name: 'Sum driftsinntekter', category: 'Inntekt' },
    { number: '20', name: 'Varekostnad', category: 'Kostnad' },
    { number: '30', name: 'Lønn og sosiale kostnader', category: 'Kostnad' },
    { number: '70', name: 'Annen driftskostnad', category: 'Kostnad' },
    { number: '80', name: 'Finansinntekter', category: 'Finans' },
    { number: '81', name: 'Finanskostnader', category: 'Finans' }
  ];

  const includedSum = populationData?.accounts
    ?.filter(acc => !excludedAccountNumbers.includes(acc.account_number))
    .reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0) || 0;

  const excludedSum = populationData?.accounts
    ?.filter(acc => excludedAccountNumbers.includes(acc.account_number))
    .reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Populasjonsvalg
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Population Summary */}
        {populationData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Totalt inkludert</div>
                <div className="font-medium">{formatNumber((populationData.accounts?.length || 0) - excludedAccountNumbers.length)} kontoer</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Inkludert beløp</div>
                <div className="font-medium">{formatCurrency(includedSum)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Totalt transaksjoner</div>
                <div className="font-medium">{formatNumber(populationData.accounts?.filter(acc => !excludedAccountNumbers.includes(acc.account_number)).reduce((sum, acc) => sum + acc.transaction_count, 0) || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gjennomsnittssaldo</div>
                <div className="font-medium">{formatCurrency(populationData.basicStatistics?.averageBalance || 0)}</div>
              </div>
            </div>
            
            {/* Enhanced statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-accent/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Median</div>
                <div className="font-medium">{formatCurrency(populationData.basicStatistics?.medianBalance || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Standardavvik</div>
                <div className="font-medium">{formatCurrency(populationData.basicStatistics?.stdDev || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Outliers</div>
                <div className="font-medium text-amber-600">{populationData.outlierDetection?.outliers?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Anomalier</div>
                <div className="font-medium text-red-600">{populationData.anomalyDetection?.anomalies?.length || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Standard Account Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Standard kontogrupper</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStandardNumbers([])}
              disabled={selectedStandardNumbers.length === 0}
            >
              Fjern alle
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {commonStandardAccounts.map(account => (
              <div
                key={account.number}
                className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 cursor-pointer"
                onClick={() => handleStandardAccountToggle(account.number)}
              >
                <Checkbox
                  checked={selectedStandardNumbers.includes(account.number)}
                  onChange={() => handleStandardAccountToggle(account.number)}
                />
                <div className="flex-1">
                  <div className="font-medium">{account.number} - {account.name}</div>
                  <div className="text-sm text-muted-foreground">{account.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Population Analysis - Always render to avoid conditional hooks */}
        <PopulationAnalysisSection 
          analysisData={populationData && selectedStandardNumbers.length > 0 ? populationData : null}
          excludedAccountNumbers={excludedAccountNumbers}
        />

        <Separator />

        {/* Account Exclusion Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Detaljerte kontoer</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyExcluded(!showOnlyExcluded)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showOnlyExcluded ? 'Vis alle' : 'Kun ekskluderte'}
              </Button>
              {excludedAccountNumbers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExcludedAccountNumbers([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Fjern alle eksluderinger
                </Button>
              )}
            </div>
          </div>

          {/* Auto-inclusion message */}
          {selectedStandardNumbers.length > 0 && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              ✓ Alle kontoer for valgte standardgrupper er automatisk inkludert. Huk av kontoer du vil ekskludere.
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter kontonummer eller navn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Account List */}
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1">
              {isCalculatingPopulation ? (
                <div className="text-center py-4 text-muted-foreground">
                  Laster kontoer...
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Ingen kontoer funnet
                </div>
              ) : (
                filteredAccounts.map(account => {
                  const isExcluded = excludedAccountNumbers.includes(account.account_number);
                  return (
                    <div
                      key={account.account_number}
                      className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer ${
                        isExcluded ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleAccountExclusionToggle(account.account_number)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={!isExcluded}
                          onChange={() => handleAccountExclusionToggle(account.account_number)}
                        />
                        <div>
                          <div className="font-medium">
                            {account.account_number} - {account.account_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(Math.abs(account.closing_balance))}
                          </div>
                        </div>
                      </div>
                      {isExcluded && (
                        <Badge variant="secondary">Ekskludert</Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {populationError && (
          <div className="text-sm text-destructive">
            Feil ved lasting av populasjon: {populationError.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopulationSelector;