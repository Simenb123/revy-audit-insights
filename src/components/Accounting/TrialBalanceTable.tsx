import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useTrialBalanceWithMappings, TrialBalanceEntryWithMapping } from '@/hooks/useTrialBalanceWithMappings';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';
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
  
  const { data: trialBalanceData, isLoading, error } = useTrialBalanceWithMappings(clientId, actualAccountingYear);
  
  // Column configuration state with dynamic labels
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);

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
      { key: 'standard_number', label: 'Regnskapsnr', visible: true },
      { key: 'standard_name', label: 'Regnskapslinje', visible: true },
    ]);
  }, [actualAccountingYear]);

  const handleColumnChange = useCallback((key: string, visible: boolean) => {
    setColumnConfig(prev => prev.map(col => 
      col.key === key ? { ...col, visible } : col
    ));
  }, []);

  // Filter entries by accounting year
  const filteredEntries = useMemo(() => {
    if (!trialBalanceData?.trialBalanceEntries) return [];
    
    return trialBalanceData.trialBalanceEntries.filter(entry => {
      if (actualAccountingYear && entry.period_year !== actualAccountingYear) return false;
      return true;
    });
  }, [trialBalanceData, actualAccountingYear]);

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
        key: 'standard_name',
        header: 'Regnskapslinje',
        accessor: (entry: TrialBalanceEntryWithMapping) => entry.standard_name || 'Ikke mappet',
        sortable: true,
        searchable: true,
        format: (value: string, entry?: TrialBalanceEntryWithMapping) => (
          <span className={!entry?.standard_name ? 'text-muted-foreground italic' : ''}>
            {value}
          </span>
        ),
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

  // Create total row dynamically based on visible columns
  const totalRow = totals ? (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={Math.max(1, columnConfig.filter(c => c.visible && !c.key.includes('balance') && !c.key.includes('turnover')).length)}>
        Sum
      </TableCell>
      {columnConfig.find(c => c.key === 'previous_year_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(0)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'opening_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals.opening_balance)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'closing_balance' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals.closing_balance)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'debit_turnover' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals.debit_turnover)}</TableCell>
      )}
      {columnConfig.find(c => c.key === 'credit_turnover' && c.visible) && (
        <TableCell className="text-right font-mono">{formatCurrency(totals.credit_turnover)}</TableCell>
      )}
      {columnConfig.find(c => (c.key === 'standard_number' || c.key === 'standard_name') && c.visible) && (
        <TableCell colSpan={columnConfig.filter(c => (c.key === 'standard_number' || c.key === 'standard_name') && c.visible).length}>
          -
        </TableCell>
      )}
    </TableRow>
  ) : null;

  // Create description text
  const mappingStats = trialBalanceData?.mappingStats;
  const description = `Viser ${filteredEntries.length} kontoer • År: ${actualAccountingYear}${mappingStats ? ` • Mappet: ${mappingStats.mappedAccounts}/${mappingStats.totalAccounts}` : ''}`;

  return (
    <div className="space-y-4">
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
        emptyMessage="Ingen kontoer funnet"
      />
    </div>
  );
};

export default TrialBalanceTable;