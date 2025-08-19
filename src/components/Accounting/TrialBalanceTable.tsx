import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Bot, Edit, Check, X, Filter, Trash, Lock, Unlock } from 'lucide-react';
import { useTrialBalanceWithMappings, TrialBalanceEntryWithMapping } from '@/hooks/useTrialBalanceWithMappings';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';
import { useSaveTrialBalanceMapping } from '@/hooks/useTrialBalanceMappings';
import { useAutoMapping } from '@/hooks/useAutoMapping';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import MappingCombobox from './MappingCombobox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import FilterPanel from './FilterPanel';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useToggleTrialBalanceLock } from '@/hooks/useTrialBalanceVersions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ReconciliationDialog from '@/components/Accounting/ReconciliationDialog';


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
  
  // Default column visibility for StandardDataTable
  const [defaultColumnState, setDefaultColumnState] = useState<{ key: string; visible: boolean }[]>([]);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<any[]>([]);
  const [hideZeroAccounts, setHideZeroAccounts] = useState<boolean>(true);
  const [showDecimals, setShowDecimals] = useState<boolean>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('tb_show_decimals') : null;
    return raw ? raw === '1' : false;
  });
  useEffect(() => {
    try { localStorage.setItem('tb_show_decimals', showDecimals ? '1' : '0'); } catch {}
  }, [showDecimals]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TrialBalanceEntryWithMapping | null>(null);
  const [openingInput, setOpeningInput] = useState<string>('');
  const [closingInput, setClosingInput] = useState<string>('');
const [reconcileOpen, setReconcileOpen] = useState(false);

  // Toggle lock mutation
  const toggleLock = useToggleTrialBalanceLock();
  const onToggleLock = useCallback(async () => {
    if (!selectedVersion) {
      toast.error('Ingen versjon valgt');
      return;
    }
    try {
      await toggleLock.mutateAsync({ clientId, periodYear: actualAccountingYear, isLocked: !isLocked });
      setIsLocked(!isLocked);
      toast.success(!isLocked ? 'Versjon låst' : 'Versjon låst opp');
    } catch (e) {
      console.error(e);
      toast.error('Kunne ikke oppdatere låsestatus');
    }
  }, [toggleLock, clientId, actualAccountingYear, isLocked, selectedVersion]);

  // Get filter parameters from URL
  const filteredAccountsParam = searchParams.get('filtered_accounts');
  const filteredAccountNumbers = filteredAccountsParam ? filteredAccountsParam.split(',') : null;
  const selectedAccountingLine = searchParams.get('accounting_line');
  const selectedSummaryLine = searchParams.get('summary_line');
  const selectedAccountType = searchParams.get('account_type');
  const selectedAnalysisGroup = searchParams.get('analysis_group');

  // Update default column state when fiscal year changes
  useEffect(() => {
    setDefaultColumnState([
      { key: 'account_number', visible: true },
      { key: 'account_name', visible: true },
      { key: 'previous_year_balance', visible: false },
      { key: 'opening_balance', visible: true },
      { key: 'closing_balance', visible: true },
      { key: 'debit_turnover', visible: false },
      { key: 'credit_turnover', visible: false },
      { key: 'standard_number', visible: false },
      { key: 'standard_category', visible: false },
      { key: 'standard_account_type', visible: false },
      { key: 'standard_analysis_group', visible: false },
      { key: 'mapping', visible: true },
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

  // Remove handleColumnChange as it's now handled by StandardDataTable

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

      // Hide zero accounts based on numeric values - check all numeric columns
      if (hideZeroAccounts) {
        const values: number[] = [
          entry.previous_year_balance || 0,
          entry.opening_balance || 0,
          entry.closing_balance || 0,
          entry.debit_turnover || 0,
          entry.credit_turnover || 0
        ];
        const hasAnyAmount = values.some(v => Math.abs(v) > 0.0049);
        if (!hasAnyAmount) return false;
      }

      return true;
    });

    return filtered;
  }, [trialBalanceData, actualAccountingYear, filteredAccountNumbers, selectedAccountingLine, selectedSummaryLine, selectedAccountType, selectedAnalysisGroup, hideZeroAccounts]);

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
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
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

  // Define columns for StandardDataTable
  const columns: StandardDataTableColumn<TrialBalanceEntryWithMapping>[] = useMemo(() => {
    const allColumns: StandardDataTableColumn<TrialBalanceEntryWithMapping>[] = [
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
        header: `Forrige år (${actualAccountingYear - 1})`,
        headerTooltip: `Utgående 31.12.${actualAccountingYear - 1}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.previous_year_balance || 0,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
        className: 'font-mono',
      },
      {
        key: 'opening_balance',
        header: `Saldo ${actualAccountingYear - 1} (Inngående ${actualAccountingYear})`,
        headerTooltip: `Inngående per 1.1.${actualAccountingYear} = utgående 31.12.${actualAccountingYear - 1}`,
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.opening_balance,
        sortable: true,
        align: 'right' as const,
        format: (value: number) => formatNumber(value),
        className: 'font-mono',
      },
      {
        key: 'closing_balance',
        header: `Saldo ${actualAccountingYear} (Utgående ${actualAccountingYear})`,
        headerTooltip: `Utgående per 31.12.${actualAccountingYear}`,
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
                sourceAccountNumber={entry.account_number}
                sourceAccountName={entry.account_name}
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

    return allColumns;
  }, [formatNumber, actualAccountingYear, standardAccounts, handleMappingChange, getAutoSuggestion, isLocked, handleEditEntry, handleDeleteEntry]);

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

  const reconciliationDiffTotal = useMemo(() => {
    const all = trialBalanceData?.trialBalanceEntries?.filter(e => e.period_year === actualAccountingYear) || [];
    const inRange = all.filter(e => {
      const n = parseInt(String(e.account_number), 10);
      return !isNaN(n) && n >= 1000 && n <= 2999;
    });
    return inRange.reduce((sum, e) => sum + (e.opening_balance - (e.previous_year_balance || 0)), 0);
  }, [trialBalanceData, actualAccountingYear]);

  // Create total row - simplified without columnConfig dependency
  const totalRow = (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={2}>Sum</TableCell>
      <TableCell className="text-right font-mono">{formatNumber(totals?.previous_year_balance || 0)}</TableCell>
      <TableCell className="text-right font-mono">{formatNumber(totals?.opening_balance || 0)}</TableCell>
      <TableCell className="text-right font-mono">{formatNumber(totals?.closing_balance || 0)}</TableCell>
      <TableCell className="text-right font-mono">{formatNumber(totals?.debit_turnover || 0)}</TableCell>
      <TableCell className="text-right font-mono">{formatNumber(totals?.credit_turnover || 0)}</TableCell>
      <TableCell colSpan={5}>-</TableCell>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="hide-zero" checked={hideZeroAccounts} onCheckedChange={setHideZeroAccounts} />
            <Label htmlFor="hide-zero">Skjul kontoer med 0 i viste kolonner</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-decimals" checked={showDecimals} onCheckedChange={setShowDecimals} />
            <Label htmlFor="show-decimals">Vis desimaler</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setReconcileOpen(true)} disabled={!selectedVersion}>
            Avstem inngående vs fjorår
          </Button>
          <Badge
            variant={Math.abs(reconciliationDiffTotal) < 0.005 ? 'secondary' : 'destructive'}
            className="ml-1 flex items-center gap-1"
            aria-live="polite"
          >
            {Math.abs(reconciliationDiffTotal) < 0.005 ? (
              <>
                <Check className="h-3 w-3" /> Avstemt
              </>
            ) : (
              <>
                <X className="h-3 w-3" /> Avvik: {formatNumber(Math.abs(reconciliationDiffTotal))}
              </>
            )}
          </Badge>
          {selectedVersion && (
            <Badge variant="outline" className="ml-1">Versjon: {selectedVersion}</Badge>
          )}
          {selectedVersion && (
            <Button variant="outline" size="sm" onClick={onToggleLock} className="gap-2">
              {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isLocked ? 'Lås opp' : 'Lås versjon'}
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={!selectedVersion || isLocked}>
            <Trash className="h-4 w-4 mr-2" />
            Slett hele saldobalansen
          </Button>
        </div>
      </div>
      <StandardDataTable
        title="Saldobalanse"
        description={description}
        icon={<Layers className="h-5 w-5" />}
        data={sortedEntries}
        columns={columns}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Søk i kontoer..."
        exportFileName={`saldobalanse_${actualAccountingYear}`}
        enablePdfExport={true}
        pdfTitle="Saldobalanse"
        showTotals={true}
        totalRow={totalRow}
        emptyMessage={`Ingen saldobalanse data for ${actualAccountingYear}`}
        virtualizeRows
        maxBodyHeight="70vh"
        rowHeight={48}
        overscan={12}
        onRowClick={handleRowClick}
        preferencesKey="trial-balance-table"
        defaultColumnState={defaultColumnState}
        tableName="Saldobalanse"
      />
      <ReconciliationDialog
        clientId={clientId}
        currentYear={actualAccountingYear}
        currentVersion={selectedVersion || null}
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
      />
    </div>
  );
};

export default TrialBalanceTable;