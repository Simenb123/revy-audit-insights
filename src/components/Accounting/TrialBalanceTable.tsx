import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { TrialBalanceEntry, useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { getFieldDefinitions } from '@/utils/fieldDefinitions';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';

interface TrialBalanceTableProps {
  clientId: string;
  selectedVersion?: string;
  accountingYear?: number;
}

const TrialBalanceTable = ({ clientId, selectedVersion, accountingYear }: TrialBalanceTableProps) => {
  const { data: trialBalanceEntries, isLoading, error } = useTrialBalanceData(clientId, selectedVersion, accountingYear);
  
  // Debug logging
  console.log('TrialBalanceTable - trialBalanceEntries:', trialBalanceEntries);
  console.log('TrialBalanceTable - isLoading:', isLoading);
  console.log('TrialBalanceTable - error:', error);
  
  // Get field definitions for trial balance
  const { data: fieldDefinitions } = useQuery({
    queryKey: ['field-definitions', 'trial_balance', accountingYear],
    queryFn: () => getFieldDefinitions('trial_balance', accountingYear),
  });

  // Filter entries by version and accounting year if provided
  const filteredByPeriod = useMemo(() => {
    const entries = trialBalanceEntries || [];
    console.log('TrialBalanceTable - entries before filter:', entries.length);
    const filtered = entries.filter(entry => {
      if (accountingYear && entry.period_year !== accountingYear) return false;
      if (selectedVersion && entry.version && entry.version !== selectedVersion) return false;
      return true;
    });
    console.log('TrialBalanceTable - entries after filter:', filtered.length);
    console.log('TrialBalanceTable - first few entries:', filtered.slice(0, 3));
    return filtered;
  }, [trialBalanceEntries, accountingYear, selectedVersion]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Define columns based on field definitions
  const columns: DataTableColumn<TrialBalanceEntry>[] = useMemo(() => {
    console.log('TrialBalanceTable - fieldDefinitions:', fieldDefinitions);
    // Always use fallback columns for debugging
    const fallbackColumns = [
        {
          key: 'account_info',
          header: 'Konto-ID',
          accessor: (entry: TrialBalanceEntry) => {
            console.log('TrialBalanceTable - processing entry:', entry);
            return `${entry.account_number} - ${entry.account_name || 'Ukjent konto'}`;
          },
          sortable: true,
          searchable: true,
          className: 'font-medium',
        },
        {
          key: 'period',
          header: 'Periode',
          accessor: (entry: TrialBalanceEntry) => `${entry.period_year} (${entry.period_end_date})`,
          sortable: true,
        },
        {
          key: 'opening_balance',
          header: 'Åpningsbalanse',
          accessor: (entry: TrialBalanceEntry) => entry.opening_balance,
          sortable: true,
          align: 'right' as const,
          format: (value: number) => formatCurrency(value),
          className: 'font-mono',
        },
        {
          key: 'debit_turnover',
          header: 'Debet',
          accessor: (entry: TrialBalanceEntry) => entry.debit_turnover,
          sortable: true,
          align: 'right' as const,
          format: (value: number) => formatCurrency(value),
          className: 'font-mono',
        },
        {
          key: 'credit_turnover',
          header: 'Kredit',
          accessor: (entry: TrialBalanceEntry) => entry.credit_turnover,
          sortable: true,
          align: 'right' as const,
          format: (value: number) => formatCurrency(value),
          className: 'font-mono',
        },
        {
          key: 'closing_balance',
          header: 'Sluttsaldo',
          accessor: (entry: TrialBalanceEntry) => entry.closing_balance,
          sortable: true,
          align: 'right' as const,
          format: (value: number) => formatCurrency(value),
          className: 'font-mono',
        },
      ];
    
    console.log('TrialBalanceTable - using fallback columns:', fallbackColumns);
    return fallbackColumns;

    /*// Map field definitions to columns
    const baseColumns: DataTableColumn<TrialBalanceEntry>[] = [
      {
        key: 'account_info',
        header: fieldDefinitions.find(f => f.field_key === 'account_number')?.field_label || 'Konto-ID',
        accessor: (entry: TrialBalanceEntry) => `${entry.account_number} - ${entry.account_name || 'Ukjent konto'}`,
        sortable: true,
        searchable: true,
        className: 'font-medium',
      },
      {
        key: 'period',
        header: 'Periode',
        accessor: (entry: TrialBalanceEntry) => `${entry.period_year} (${entry.period_end_date})`,
        sortable: true,
      },
    ];

    // Add balance columns based on field definitions
    const openingField = fieldDefinitions.find(f => f.field_key === 'opening_balance');
    const debitField = fieldDefinitions.find(f => f.field_key === 'debit_turnover');
    const creditField = fieldDefinitions.find(f => f.field_key === 'credit_turnover');
    const closingField = fieldDefinitions.find(f => f.field_key === 'closing_balance');

    if (openingField) {
      baseColumns.push({
        key: 'opening_balance',
        header: openingField.field_label,
        accessor: 'opening_balance',
        sortable: true,
        align: 'right',
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      });
    }

    if (debitField) {
      baseColumns.push({
        key: 'debit_turnover',
        header: debitField.field_label,
        accessor: 'debit_turnover',
        sortable: true,
        align: 'right',
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      });
    }

    if (creditField) {
      baseColumns.push({
        key: 'credit_turnover',
        header: creditField.field_label,
        accessor: 'credit_turnover',
        sortable: true,
        align: 'right',
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      });
    }

    if (closingField) {
      baseColumns.push({
        key: 'closing_balance',
        header: closingField.field_label,
        accessor: 'closing_balance',
        sortable: true,
        align: 'right',
        format: (value: number) => formatCurrency(value),
        className: 'font-mono',
      });
    }

    return baseColumns;*/
  }, [fieldDefinitions]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredByPeriod) return null;
    
    return {
      opening_balance: filteredByPeriod.reduce((sum, entry) => sum + entry.opening_balance, 0),
      debit_turnover: filteredByPeriod.reduce((sum, entry) => sum + entry.debit_turnover, 0),
      credit_turnover: filteredByPeriod.reduce((sum, entry) => sum + entry.credit_turnover, 0),
      closing_balance: filteredByPeriod.reduce((sum, entry) => sum + entry.closing_balance, 0),
    };
  }, [filteredByPeriod]);

  // Create total row
  const totalRow = totals ? (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={2}>Sum</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(totals.opening_balance)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(totals.debit_turnover)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(totals.credit_turnover)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(totals.closing_balance)}</TableCell>
    </TableRow>
  ) : null;

  // Create description text
  const description = `Viser ${filteredByPeriod.length} kontoer${selectedVersion ? ` • Versjon: ${selectedVersion}` : ''}${accountingYear ? ` • År: ${accountingYear}` : ''}${trialBalanceEntries && trialBalanceEntries.length > 0 ? ` • Periode slutt: ${trialBalanceEntries[0].period_end_date}` : ''}`;

  return (
    <DataTable
      title="Saldobalanse"
      description={description}
      icon={<Layers className="h-5 w-5" />}
      data={filteredByPeriod}
      columns={columns}
      isLoading={isLoading}
      error={error}
      searchPlaceholder="Søk i kontoer..."
      enableExport={true}
      exportFileName={`saldobalanse_${accountingYear || new Date().getFullYear()}`}
      showTotals={true}
      totalRow={totalRow}
      emptyMessage="Ingen kontoer funnet"
    />
  );
};

export default TrialBalanceTable;