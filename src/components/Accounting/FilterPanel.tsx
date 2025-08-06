import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';

interface FilterPanelProps {
  className?: string;
}

const FilterPanel = ({ className }: FilterPanelProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: standardAccounts = [] } = useStandardAccounts();
  
  const selectedAccountingLine = searchParams.get('accounting_line');
  const selectedSummaryLine = searchParams.get('summary_line');
  const selectedAccountType = searchParams.get('account_type');
  const selectedAnalysisGroup = searchParams.get('analysis_group');
  
  // Group standard accounts by category for summary line filtering
  const summaryLineOptions = useMemo(() => {
    const categories = new Set<string>();
    standardAccounts.forEach(account => {
      if (account.category) {
        categories.add(account.category);
      }
    });
    return Array.from(categories).sort();
  }, [standardAccounts]);

  // Group standard accounts by analysis_group
  const analysisGroupOptions = useMemo(() => {
    const groups = new Set<string>();
    standardAccounts.forEach(account => {
      if (account.analysis_group) {
        groups.add(account.analysis_group);
      }
    });
    return Array.from(groups).sort();
  }, [standardAccounts]);

  // Account type options (based on common Norwegian chart of accounts)
  const accountTypeOptions = [
    { value: 'asset', label: 'Eiendeler' },
    { value: 'liability', label: 'Gjeld' },
    { value: 'equity', label: 'Egenkapital' },
    { value: 'revenue', label: 'Inntekt' },
    { value: 'expense', label: 'Kostnad' },
  ];

  const handleFilterChange = (key: string, value: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  const clearAllFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('accounting_line');
    newSearchParams.delete('summary_line');
    newSearchParams.delete('account_type');
    newSearchParams.delete('analysis_group');
    newSearchParams.delete('filtered_accounts');
    setSearchParams(newSearchParams);
  };

  const activeFiltersCount = [selectedAccountingLine, selectedSummaryLine, selectedAccountType, selectedAnalysisGroup].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Collapsible className={className}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Avanserte filtre</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Regnskapslinje filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Regnskapslinje</label>
            <Select
              value={selectedAccountingLine || 'all'}
              onValueChange={(value) => handleFilterChange('accounting_line', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg regnskapslinje" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">Alle regnskapslinjer</SelectItem>
                {standardAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.standard_number}>
                    {account.standard_number} - {account.standard_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary line filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori (Sumlinje)</label>
            <Select
              value={selectedSummaryLine || 'all'}
              onValueChange={(value) => handleFilterChange('summary_line', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {summaryLineOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account type filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kontotype</label>
            <Select
              value={selectedAccountType || 'all'}
              onValueChange={(value) => handleFilterChange('account_type', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg kontotype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kontotyper</SelectItem>
                {accountTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analysis group filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Analysegruppe</label>
            <Select
              value={selectedAnalysisGroup || 'all'}
              onValueChange={(value) => handleFilterChange('analysis_group', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg analysegruppe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle analysegrupper</SelectItem>
                {analysisGroupOptions.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Aktive filtre:</span>
            <div className="flex flex-wrap gap-2">
              {selectedAccountingLine && (
                <Badge variant="secondary" className="gap-1">
                  {standardAccounts.find(a => a.standard_number === selectedAccountingLine)?.standard_name || selectedAccountingLine}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('accounting_line', null)}
                  />
                </Badge>
              )}
              {selectedSummaryLine && (
                <Badge variant="secondary" className="gap-1">
                  {selectedSummaryLine}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('summary_line', null)}
                  />
                </Badge>
              )}
              {selectedAccountType && (
                <Badge variant="secondary" className="gap-1">
                  {accountTypeOptions.find(o => o.value === selectedAccountType)?.label || selectedAccountType}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('account_type', null)}
                  />
                </Badge>
              )}
              {selectedAnalysisGroup && (
                <Badge variant="secondary" className="gap-1">
                  {selectedAnalysisGroup}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('analysis_group', null)}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                Fjern alle
              </Button>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FilterPanel;