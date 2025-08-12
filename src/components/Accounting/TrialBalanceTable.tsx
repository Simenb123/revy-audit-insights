import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Bot, Edit, Check, X, Filter, Trash } from 'lucide-react';
import { useTrialBalanceWithMappings, TrialBalanceEntryWithMapping } from '@/hooks/useTrialBalanceWithMappings';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import { useSaveTrialBalanceMapping } from '@/hooks/useTrialBalanceMappings';
import { useAutoMapping } from '@/hooks/useAutoMapping';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import MappingCombobox from './MappingCombobox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ColumnSelector, { ColumnConfig } from './ColumnSelector';
import FilterPanel from './FilterPanel';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';


interface TrialBalanceTableProps {
  clientId: string;
  selectedVersion?: string;
  accountingYear?: number;
}

const TrialBalanceTable = ({ clientId, selectedVersion, accountingYear }: TrialBalanceTableProps) => {
  const { selectedFiscalYear } = useFiscalYear();
  const actualAccountingYear = accountingYear || selectedFiscalYear;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { data: trialBalanceData, isLoading, error, refetch } = useTrialBalanceWithMappings(clientId, actualAccountingYear, selectedVersion);
  const { data: standardAccounts = [] } = useStandardAccounts();
  const saveMapping = useSaveTrialBalanceMapping();
  const { generateAutoMappingSuggestions, applyAutoMapping, isApplying } = useAutoMapping(clientId);
  
  // Column configuration state with dynamic labels
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
  const [hideZeroAccounts, setHideZeroAccounts] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TrialBalanceEntryWithMapping | null>(null);
  const [openingInput, setOpeningInput] = useState<string>('');
  const [closingInput, setClosingInput] = useState<string>('');

  // Get filter parameters from URL
  const filteredAccountsParam = searchParams.get('filtered_accounts');
  const filteredAccountNumbers = filteredAccountsParam ? filteredAccountsParam.split(',') : null;
  const selectedAccountingLine = searchParams.get('accounting_line');
  const selectedSummaryLine = searchParams.get('summary_line');
  const selectedAccountType = searchParams.get('account_type');
  const selectedAnalysisGroup = searchParams.get('analysis_group');

  // Update column config when fiscal year changes
  useEffect(() => {
    const previousYear = actualAccountingYear - 1;
    setColumnConfig([
      { key: 'account_number', label: 'Kontonr', visible: true, required: true },
      { key: 'account_name', label: 'Kontonavn', visible: true, required: true },
      { key: 'previous_year_balance', label: `Saldo ${previousYear}`, visible: false },
      { key: 'opening_balance', label: `Inngående balanse ${actualAccountingYear}`, visible: true },
      { key: 'closing_balance', label: `Saldo ${actualAccountingYear}`, visible: true },
      { key: 'debit_turnover', label: 'Debet', visible: false },
      { key: 'credit_turnover', label: 'Kredit', visible: false },
      { key: 'standard_number', label: 'Regnskapsnr', visible: false },
      { key: 'standard_category', label: 'Kategori', visible: false },
      { key: 'standard_account_type', label: 'Kontotype', visible: false },
      { key: 'standard_analysis_group', label: 'Analysegruppe', visible: false },
      { key: 'mapping', label: 'Regnskapslinje', visible: true },
    ]);
  }, [actualAccountingYear]);

  // Fetch lock status for selected version/year
  useEffect(() => {
    let query = supabase
      .from('trial_balances')
      .select('is_locked, created_at, version')
      .eq('client_id', clientId)
      .eq('period_year', actualAccountingYear)
      .order('created_at', { ascending: false })
      .limit(1);
    if (selectedVersion) {
      query = query.eq('version', selectedVersion);
    }
    query.then(({ data, error }) => {
      if (error) {
        console.warn('Kunne ikke hente låsestatus', error);
        setIsLocked(false);
      } else {
        setIsLocked(!!data?.[0]?.is_locked);
      }
    });
  }, [clientId, actualAccountingYear, selectedVersion]);

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
  }, [trialBalanceData]);

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

  const handleRowClick = useCallback((entry: TrialBalanceEntryWithMapping) => {
    if (!entry?.account_number) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'ledger');
    newParams.set('gl_account', entry.account_number);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Filter entries by accounting year and advanced filters
  const filteredEntries = useMemo(() => {
    if (!trialBalanceData?.trialBalanceEntries) return [];

    const filtered = trialBalanceData.trialBalanceEntries.filter(entry => {
      if (actualAccountingYear && entry.period_year !== actualAccountingYear) return false;

      // If filtered accounts are specified (from report builder), only show those
      if (filteredAccountNumbers && filteredAccountNumbers.length > 0) {
        return filteredAccountNumbers.includes(entry.account_number);
      }

      // Advanced filters
      if (selectedAccountingLine && entry.standard_number !== selectedAccountingLine) {
        return false;
      }

      if (selectedSummaryLine && entry.standard_category !== selectedSummaryLine) {
        return false;
      }

      if (selectedAccountType && entry.standard_account_type !== selectedAccountType) {
        return false;
      }

      if (selectedAnalysisGroup && entry.standard_analysis_group !== selectedAnalysisGroup) {
        return false;
      }

      // Hide zero accounts based on visible numeric columns
      if (hideZeroAccounts) {
        const visibleKeys = new Set(columnConfig.filter(c => c.visible).map(c => c.key));
        const values: number[] = [];
        if (visibleKeys.has('previous_year_balance')) values.push(entry.previous_year_balance || 0);
        if (visibleKeys.has('opening_balance')) values.push(entry.opening_balance || 0);
        if (visibleKeys.has('closing_balance')) values.push(entry.closing_balance || 0);
        if (visibleKeys.has('debit_turnover')) values.push(entry.debit_turnover || 0);
        if (visibleKeys.has('credit_turnover')) values.push(entry.credit_turnover || 0);
        const hasAnyAmount = values.some(v => Math.abs(v) > 0.0049);
        if (!hasAnyAmount) return false;
      }

      return true;
    });

    return filtered;
  }, [trialBalanceData, actualAccountingYear, filteredAccountNumbers, selectedAccountingLine, selectedSummaryLine, selectedAccountType, selectedAnalysisGroup, hideZeroAccounts, columnConfig]);

  // Natural sort by account number by default
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) =>
      String(a.account_number || '').localeCompare(String(b.account_number || ''), undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [filteredEntries]);

  // Function to clear account filter
  const clearAccountFilter = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('filtered_accounts');
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // Check if any advanced filters are active
  const hasAdvancedFilters = selectedAccountingLine || selectedSummaryLine || selectedAccountType || selectedAnalysisGroup;

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number' && !isNaN(value)) return value;
    let s = String(value).trim().replace(/\s+/g, '');
    s = s.replace(/[^\d,.-]/g, '');
    let negative = false;
    if (s.startsWith('-')) { negative = true; s = s.slice(1); }
    if (s.includes(',') && s.includes('.')) {
      const lastComma = s.lastIndexOf(',');
      const lastDot = s.lastIndexOf('.');
      if (lastComma > lastDot) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    }
    const n = parseFloat(s);
    return negative ? -Math.abs(n || 0) : (n || 0);
  };

  const handleEditEntry = useCallback((entry: TrialBalanceEntryWithMapping) => {
    if (isLocked) {
      toast.error('Denne versjonen er låst. Lås opp for å redigere.');
      return;
    }
    setEditEntry(entry);
    setOpeningInput(entry.opening_balance.toString());
    setClosingInput(entry.closing_balance.toString());
    setEditOpen(true);
  }, [isLocked]);

  const handleSaveEdit = useCallback(async () => {
    if (!editEntry) return;
    try {
      const opening_balance = parseNumber(openingInput);
      const closing_balance = parseNumber(closingInput);
      const { error } = await supabase
        .from('trial_balances')
        .update({ opening_balance, closing_balance })
        .eq('id', editEntry.id);
      if (error) throw error;
      toast.success(`Konto ${editEntry.account_number} oppdatert`);
      setEditOpen(false);
      setEditEntry(null);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke oppdatere kontoen');
    }
  }, [editEntry, openingInput, closingInput, refetch]);

  const handleDeleteEntry = useCallback(async (entry: TrialBalanceEntryWithMapping) => {
    try {
      if (isLocked) {
        toast.error('Denne versjonen er låst. Lås opp for å slette.');
        return;
      }
      if (!window.confirm(`Slette konto ${entry.account_number}?`)) return;
      const { error } = await supabase
        .from('trial_balances')
        .delete()
        .eq('id', entry.id);
      if (error) throw error;
      toast.success(`Konto ${entry.account_number} slettet`);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Kunne ikke slette kontoen');
    }
  }, [refetch, isLocked]);

  const handleDeleteAll = useCallback(async () => {
    if (!selectedVersion) {
      toast.error('Ingen versjon valgt for sletting');
      return;
    }
    const first = window.confirm(`Slette hele saldobalansen for ${actualAccountingYear} (${selectedVersion})?`);
    if (!first) return;
    const second = window.confirm('Er du sikker? Dette kan ikke angres.');
    if (!second) return;
    try {
      const { error } = await supabase
        .from('trial_balances')
        .delete()
        .eq('client_id', clientId)
        .eq('period_year', actualAccountingYear)
        .eq('version', selectedVersion);
      if (error) throw error;
      toast.success('Saldobalanse slettet');
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Kunne ikke slette saldobalansen');
    }
  }, [clientId, actualAccountingYear, selectedVersion, refetch]);

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
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.previous_year_balance || 0,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
        className: 'font-mono',
      },
      {
        key: 'opening_balance',
        header: `Inngående balanse ${actualAccountingYear}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.opening_balance,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
        className: 'font-mono',
      },
      {
        key: 'closing_balance',
        header: `Saldo ${actualAccountingYear}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.closing_balance,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
        className: 'font-mono',
      },
      {
        key: 'debit_turnover',
        header: 'Debet',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.debit_turnover,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
        className: 'font-mono',
      },
      {
        key: 'credit_turnover',
        header: 'Kredit',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.credit_turnover,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
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
        key: 'standard_category',
        header: 'Kategori',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.standard_category || '-',
        sortable: true,
        searchable: true,
        className: 'text-sm',
      },
      {
        key: 'standard_account_type',
        header: 'Kontotype',
        accessor: (entry: TrialBalanceEntryWithMapping) => {
          const typeMap: Record<string, string> = {
            'asset': 'Eiendel',
            'liability': 'Gjeld',
            'equity': 'Egenkapital',
            'revenue': 'Inntekt',
            'expense': 'Kostnad'
          };
          return typeMap[entry.standard_account_type || ''] || entry.standard_account_type || '-';
        },
        sortable: true,
        searchable: true,
        className: 'text-sm',
      },
      {
        key: 'standard_analysis_group',
        header: 'Analysegruppe',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.standard_analysis_group || '-',
        sortable: true,
        searchable: true,
        className: 'text-sm',
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

          return (
            <div className="flex items-center gap-2 min-w-[260px]" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <MappingCombobox
                value={entry.standard_number || ''}
                onChange={(val) => val && handleMappingChange(entry.account_number, val)}
                options={standardAccounts}
                placeholder={suggestion ? `Foreslås: ${suggestion.suggestedMapping}` : 'Velg regnskapslinje'}
                className="h-8 text-xs"
              />

              {!entry.standard_number && suggestion && (
                <Badge variant="outline" className="text-xs">
                  <Bot className="h-3 w-3 mr-1" />{suggestion.suggestedMapping}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Handlinger',
        accessor: (entry: TrialBalanceEntryWithMapping) => '',
        sortable: false,
        format: (_: any, entry?: TrialBalanceEntryWithMapping) => {
          if (!entry) return null;
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditEntry(entry)} title="Rediger beløp" disabled={isLocked}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDeleteEntry(entry)} title="Slett konto" disabled={isLocked}>
                <Trash className="h-4 w-4" />
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
  }, [columnConfig, formatNumber, actualAccountingYear, standardAccounts, handleMappingChange, getAutoSuggestion]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredEntries) return null;
    
    return {
      previous_year_balance: filteredEntries.reduce((sum, entry) => sum + (entry.previous_year_balance || 0), 0),
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
        <TableCell className="text-right font-mono">{formatNumber(totals?.previous_year_balance || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'opening_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatNumber(totals?.opening_balance || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'closing_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatNumber(totals?.closing_balance || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'debit_turnover' && c.visible) && (
        <TableCell className="text-right font-mono">{formatNumber(totals?.debit_turnover || 0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'credit_turnover' && c.visible) && (
        <TableCell className="text-right font-mono">{formatNumber(totals?.credit_turnover || 0)}</TableCell>
      )}
      {columnConfig.find(c => ['standard_number', 'standard_category', 'standard_account_type', 'standard_analysis_group', 'mapping'].includes(c.key) && c.visible) && (
        <TableCell colSpan={columnConfig.filter(c => ['standard_number', 'standard_category', 'standard_account_type', 'standard_analysis_group', 'mapping'].includes(c.key) && c.visible).length}>
          -
        </TableCell>
      )}
    </TableRow>
  );

  // Create description text
  const mappingStats = trialBalanceData?.mappingStats;
  const mappingProgress = getMappingProgress();
  const totalEntries = trialBalanceData?.trialBalanceEntries?.length || 0;
  const baseDescription = `Viser ${filteredEntries.length}${totalEntries !== filteredEntries.length ? ` av ${totalEntries}` : ''} kontoer • År: ${actualAccountingYear}${mappingStats ? ` • Mappet: ${mappingStats.mappedAccounts}/${mappingStats.totalAccounts}` : ''}`;
  const description = (filteredAccountNumbers || hasAdvancedFilters) ? `${baseDescription} • Filtrert visning` : baseDescription;

  return (
    <div className="space-y-4">
      {/* Filter notifications */}
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

      {/* Advanced filters panel */}
      <FilterPanel className="mb-4" />
      
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
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="hide-zero" checked={hideZeroAccounts} onCheckedChange={setHideZeroAccounts} />
          <Label htmlFor="hide-zero">Skjul kontoer med 0 i viste kolonner</Label>
        </div>
        <div className="flex items-center gap-2">
          <ColumnSelector 
            columns={columnConfig}
            onColumnChange={handleColumnChange}
          />
          <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={!selectedVersion || isLocked}>
            <Trash className="h-4 w-4 mr-2" />
            Slett hele saldobalansen
          </Button>
        </div>
      </div>
      <DataTable
        title="Saldobalanse"
        description={description}
        icon={<Layers className="h-5 w-5" />}
        data={sortedEntries}
        columns={columns}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Søk i kontoer..."
        enableExport={true}
        exportFileName={`saldobalanse_${actualAccountingYear}`}
        showTotals={true}
        totalRow={totalRow}
        emptyMessage={`Ingen saldobalanse data for ${actualAccountingYear}`}
        virtualizeRows
        maxBodyHeight="70vh"
        rowHeight={48}
        overscan={12}
        onRowClick={handleRowClick}
      />
    </div>
  );
};

export default TrialBalanceTable;