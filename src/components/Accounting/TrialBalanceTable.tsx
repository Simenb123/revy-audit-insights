import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Bot, Edit, Check, X, Filter } from 'lucide-react';
import { useTrialBalanceWithMappings, TrialBalanceEntryWithMapping } from '@/hooks/useTrialBalanceWithMappings';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import { useSaveTrialBalanceMapping } from '@/hooks/useTrialBalanceMappings';
import { useAutoMapping } from '@/hooks/useAutoMapping';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ColumnSelector, { ColumnConfig } from './ColumnSelector';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface TrialBalanceTableProps {
  clientId: string;
  selectedVersion?: string;
  accountingYear?: number;
}

const TrialBalanceTable = ({ clientId, selectedVersion, accountingYear }: TrialBalanceTableProps) => {
  const { selectedFiscalYear } = useFiscalYear();
  const actualAccountingYear = accountingYear || selectedFiscalYear;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { data: trialBalanceData, isLoading, error } = useTrialBalanceWithMappings(clientId, actualAccountingYear, selectedVersion);
  const { data: standardAccounts = [] } = useStandardAccounts();
  const saveMapping = useSaveTrialBalanceMapping();
  const { generateAutoMappingSuggestions, applyAutoMapping, isApplying } = useAutoMapping(clientId);
  
  // Column configuration state with dynamic labels
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
  
  // Get filtered accounts from URL params
  const filteredAccountsParam = searchParams.get('filtered_accounts');
  const filteredAccountNumbers = filteredAccountsParam ? filteredAccountsParam.split(',') : null;

  // Update column config when fiscal year changes
  useEffect(() => {
    const previousYear = actualAccountingYear - 1;
    setColumnConfig([
      { key: 'account_number', label: 'Kontonr', visible: true, required: true },
      { key: 'account_name', label: 'Kontonavn', visible: true, required: true },
      { key: 'previous_year_balance', label: `Saldo ${previousYear}`, visible: true },
      { key: 'opening_balance', label: `Inngående balanse ${actualAccountingYear}`, visible: true },
      { key: 'closing_balance', label: `Saldo ${actualAccountingYear}`, visible: true },
      { key: 'debit_turnover', label: 'Debet', visible: false },
      { key: 'credit_turnover', label: 'Kredit', visible: false },
      { key: 'standard_number', label: 'Regnskapsnr', visible: false },
      { key: 'mapping', label: 'Regnskapslinje', visible: true },
    ]);
  }, [actualAccountingYear]);

  const handleColumnChange = useCallback((key: string, visible: boolean) => {
    setColumnConfig(prev => prev.map(col => 
      col.key === key ? { ...col, visible } : col
    ));
  }, []);

  // Auto-generate mapping suggestions when data loads
  useEffect(() => {
    if (trialBalanceData?.trialBalanceEntries) {
      const suggestions = generateAutoMappingSuggestions();
      setAutoSuggestions(suggestions);
    }
  }, [trialBalanceData, generateAutoMappingSuggestions]);

  const handleMappingChange = useCallback(async (accountNumber: string, standardNumber: string) => {
    try {
      await saveMapping.mutateAsync({
        clientId,
        accountNumber,
        statementLineNumber: standardNumber
      });
      setEditingMapping(null);
    } catch (error) {
      console.error('Error saving mapping:', error);
    }
  }, [clientId, saveMapping]);

  const handleAutoMapping = useCallback(async () => {
    const suggestions = generateAutoMappingSuggestions();
    if (suggestions.length > 0) {
      try {
        await applyAutoMapping.mutateAsync(suggestions);
        setAutoSuggestions([]);
      } catch (error) {
        console.error('Error applying auto mapping:', error);
      }
    }
  }, [generateAutoMappingSuggestions, applyAutoMapping]);

  const getAutoSuggestion = useCallback((accountNumber: string) => {
    return autoSuggestions.find(s => s.accountNumber === accountNumber);
  }, [autoSuggestions]);

  const getMappingProgress = useCallback(() => {
    if (!trialBalanceData?.mappingStats) return 0;
    const { mappedAccounts, totalAccounts } = trialBalanceData.mappingStats;
    return totalAccounts > 0 ? (mappedAccounts / totalAccounts) * 100 : 0;
  }, [trialBalanceData]);

  // Filter entries by accounting year and filtered accounts
  const filteredEntries = useMemo(() => {
    if (!trialBalanceData?.trialBalanceEntries) return [];
    
    return trialBalanceData.trialBalanceEntries.filter(entry => {
      if (actualAccountingYear && entry.period_year !== actualAccountingYear) return false;
      
      // If filtered accounts are specified, only show those
      if (filteredAccountNumbers && filteredAccountNumbers.length > 0) {
        return filteredAccountNumbers.includes(entry.account_number);
      }
      
      return true;
    });
  }, [trialBalanceData, actualAccountingYear, filteredAccountNumbers]);

  // Function to clear account filter
  const clearAccountFilter = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('filtered_accounts');
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Define columns based on configuration
  const columns: DataTableColumn<TrialBalanceEntryWithMapping>[] = useMemo(() => {
    const allColumns: DataTableColumn<TrialBalanceEntryWithMapping>[] = [
      {
        key: 'account_number',
        header: 'Kontonr',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.account_number,
        sortable: true,
        searchable: true,
        className: 'font-medium',
      },
      {
        key: 'account_name',
        header: 'Kontonavn',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.account_name,
        sortable: true,
        searchable: true,
        className: 'font-medium',
      },
      {
        key: 'previous_year_balance',
        header: `Saldo ${actualAccountingYear - 1}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => 0, // Placeholder for now
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      },
      {
        key: 'opening_balance',
        header: `Inngående balanse ${actualAccountingYear}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.opening_balance,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      },
      {
        key: 'closing_balance',
        header: `Saldo ${actualAccountingYear}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.closing_balance,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      },
      {
        key: 'debit_turnover',
        header: 'Debet',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.debit_turnover,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      },
      {
        key: 'credit_turnover',
        header: 'Kredit',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.credit_turnover,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      },
      {
        key: 'standard_number',
        header: 'Regnskapsnr',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.standard_number || '-',
        sortable: true,
        searchable: true,
        className: 'font-medium',
      },
      {
        key: 'mapping',
        header: 'Regnskapslinje',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.standard_name || 'Ikke mappet',
        sortable: false,
        searchable: false,
        format: (value: string, entry?: TrialBalanceEntryWithMapping) => {
          if (!entry) return value;
          
          const suggestion = getAutoSuggestion(entry.account_number);
          const isEditing = editingMapping === entry.account_number;
          const hasMappingGap = !entry.standard_name;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2 min-w-[200px]">
                <Select
                  defaultValue={entry.standard_number || suggestion?.suggestedMapping || ''}
                  onValueChange={(value) => {
                    if (value) {
                      handleMappingChange(entry.account_number, value);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Velg regnskapslinje" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {standardAccounts.map(account => (
                      <SelectItem key={account.id} value={account.standard_number}>
                        {account.standard_number} - {account.standard_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingMapping(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          }

          if (hasMappingGap) {
            return (
              <div className="flex items-center gap-2">
                {suggestion ? (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                    >
                      <Bot className="h-3 w-3 mr-1" />
                      {suggestion.suggestedMapping}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMappingChange(entry.account_number, suggestion.suggestedMapping)}
                      className="h-6 px-2 text-xs"
                      disabled={saveMapping.isPending}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Bruk
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMapping(entry.account_number)}
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Mapp
                  </Button>
                )}
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {entry.standard_number} - {entry.standard_name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingMapping(entry.account_number)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
    ];

    // Filter columns based on visibility settings
    return allColumns.filter(col => {
      const config = columnConfig.find(c => c.key === col.key);
      return config?.visible === true;
    });
  }, [columnConfig, formatCurrency]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredEntries) return null;
    
    return {
      opening_balance: filteredEntries.reduce((sum, entry) => sum + entry.opening_balance, 0),
      debit_turnover: filteredEntries.reduce((sum, entry) => sum + entry.debit_turnover, 0),
      credit_turnover: filteredEntries.reduce((sum, entry) => sum + entry.credit_turnover, 0),
      closing_balance: filteredEntries.reduce((sum, entry) => sum + entry.closing_balance, 0),
    };
  }, [filteredEntries]);

  // Create total row dynamically based on visible columns - show even when no data
  const totalRow = (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={Math.max(1, columnConfig.filter(c => c.visible && !c.key.includes('balance') && !c.key.includes('turnover')).length)}>
        Sum
      </TableCell>
      {columnConfig.find(c => c.key === 'previous_year_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'opening_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals?.opening_balance || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'closing_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals?.closing_balance || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'debit_turnover' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals?.debit_turnover || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'credit_turnover' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals?.credit_turnover || 0)}</TableCell>
      )}
      {columnConfig.find(c => (c.key === 'standard_number' || c.key === 'mapping') && c.visible) && (
        <TableCell colSpan={columnConfig.filter(c => (c.key === 'standard_number' || c.key === 'mapping') && c.visible).length}>
          -
        </TableCell>
      )}
    </TableRow>
  );

  // Create description text
  const mappingStats = trialBalanceData?.mappingStats;
  const mappingProgress = getMappingProgress();
  const baseDescription = `Viser ${filteredEntries.length} kontoer • År: ${actualAccountingYear}${mappingStats ? ` • Mappet: ${mappingStats.mappedAccounts}/${mappingStats.totalAccounts}` : ''}`;
  const description = filteredAccountNumbers ? `${baseDescription} • Filtrert visning` : baseDescription;

  return (
    <div className="space-y-4">
      {/* Account filter notification */}
      {filteredAccountNumbers && filteredAccountNumbers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Filtrert på {filteredAccountNumbers.length} kontoer fra regnskapsoppstilling
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAccountFilter}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <X className="h-4 w-4 mr-2" />
              Fjern filter
            </Button>
          </div>
        </div>
      )}
      
      {/* Mapping progress and auto-mapping controls */}
      {mappingStats && mappingStats.totalAccounts > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                Mapping progresjon ({mappingStats.mappedAccounts}/{mappingStats.totalAccounts})
              </div>
              <Progress value={mappingProgress} className="w-48 h-2" />
            </div>
            {autoSuggestions.length > 0 && (
              <Button
                onClick={handleAutoMapping}
                disabled={isApplying}
                className="gap-2"
              >
                <Bot className="h-4 w-4" />
                Automatisk mapping ({autoSuggestions.length})
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <ColumnSelector 
          columns={columnConfig}
          onColumnChange={handleColumnChange}
        />
      </div>
      <DataTable
        title="Saldobalanse"
        description={description}
        icon={<Layers className="h-5 w-5" />}
        data={filteredEntries}
        columns={columns}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Søk i kontoer..."
        enableExport={true}
        exportFileName={`saldobalanse_${actualAccountingYear}`}
        showTotals={true}
        totalRow={totalRow}
        emptyMessage={`Ingen saldobalanse data for ${actualAccountingYear}`}
      />
    </div>
  );
};

export default TrialBalanceTable;