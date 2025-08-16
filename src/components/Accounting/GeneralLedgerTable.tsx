import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { GeneralLedgerTransaction, useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useGeneralLedgerCount } from '@/hooks/useGeneralLedgerCount';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { getFieldDefinitions } from '@/utils/fieldDefinitions';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import ColumnSelector, { ColumnConfig } from '@/components/Accounting/ColumnSelector';
interface GeneralLedgerTableProps {
  clientId: string;
  versionId?: string;
  accountNumberFilter?: string;
}

const GeneralLedgerTable = ({ clientId, versionId, accountNumberFilter }: GeneralLedgerTableProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<string>('');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [isGlobalSorting, setIsGlobalSorting] = React.useState(false);
  const pageSize = 100;
  const isDebug = process.env.NODE_ENV !== 'production';

  if (isDebug) {
    logger.log('🔍 GeneralLedgerTable rendering for client:', clientId, 'version:', versionId);
  }
  
  // All sorting is now server-side with denormalized data
  const { data: transactions, isLoading, error } = useGeneralLedgerData(
    clientId, 
    versionId, 
    { page: currentPage, pageSize }, 
    { 
      accountNumber: accountNumberFilter, 
      sortBy, 
      sortOrder
    }
  );

  const { data: serverTotalCount, isLoading: isCountLoading } = useGeneralLedgerCount(clientId, versionId, { accountNumber: accountNumberFilter });
  
  const sortedTransactions = transactions;
  const totalCount = serverTotalCount;
  const { data: allTransactions, isLoading: isExportLoading } = useGeneralLedgerData(clientId, versionId, undefined, { accountNumber: accountNumberFilter });
  const { data: activeVersion } = useActiveVersion(clientId);

  if (isDebug) {
    logger.log('📊 GeneralLedgerTable data:', {
      transactionsCount: transactions?.length || 0,
      totalCount,
      isLoading,
      error: error?.message
    });
  }
  
  // Get field definitions for general ledger
  const { data: fieldDefinitions } = useQuery({
    queryKey: ['field-definitions', 'general_ledger'],
    queryFn: () => getFieldDefinitions('general_ledger'),
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Kolonnevalg (gjenbruk fra Saldobalanse)
  const [columnConfig, setColumnConfig] = React.useState<ColumnConfig[]>([
    { key: 'transaction_date', label: 'Dato', visible: true, required: true },
    { key: 'account_number', label: 'Kontonr', visible: true, required: true },
    { key: 'account_name', label: 'Kontonavn', visible: true, required: true },
    { key: 'description', label: 'Beskrivelse', visible: true },
    { key: 'voucher_number', label: 'Bilag', visible: true },
    { key: 'debit_amount', label: 'Debet', visible: true },
    { key: 'credit_amount', label: 'Kredit', visible: true },
    { key: 'balance_amount', label: 'Beløp', visible: true },
    { key: 'vat_code', label: 'MVA-kode', visible: false },
    { key: 'vat_rate', label: 'MVA-sats', visible: false },
    { key: 'vat_base', label: 'MVA-grunnlag', visible: false },
    { key: 'vat_amount', label: 'MVA-beløp', visible: false },
  ]);

  const handleColumnChange = React.useCallback((key: string, visible: boolean) => {
    setColumnConfig(prev => prev.map(c => (c.key === key ? { ...c, visible } : c)));
  }, []);

  const handleSort = React.useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  // Alle kolonner basert på felter
  const allColumns: DataTableColumn<GeneralLedgerTransaction>[] = useMemo(() => {
    const debitCol: DataTableColumn<GeneralLedgerTransaction> = {
      key: 'debit_amount',
      header: 'Debet',
      accessor: 'debit_amount',
      sortable: true,
      align: 'right',
      format: (value: number | null) => formatCurrency(value ?? 0),
    };

    const creditCol: DataTableColumn<GeneralLedgerTransaction> = {
      key: 'credit_amount',
      header: 'Kredit',
      accessor: 'credit_amount',
      sortable: true,
      align: 'right',
      format: (value: number | null) => formatCurrency(value ?? 0),
    };

    const amountCol: DataTableColumn<GeneralLedgerTransaction> = {
      key: 'balance_amount',
      header: 'Beløp',
      accessor: 'balance_amount',
      sortable: true,
      align: 'right',
      format: (value: number | null) => (
        <span className={value && value < 0 ? 'text-destructive' : ''}>
          {formatCurrency(value)}
        </span>
      ),
    };

    if (!fieldDefinitions) {
      // Fallback-kolonner dersom feltdefinisjoner ikke er lastet
        return [
          {
            key: 'transaction_date',
            header: 'Dato',
            accessor: 'transaction_date',
            sortable: true,
            format: (value: string) => format(new Date(value), 'dd.MM.yyyy'),
          },
          {
            key: 'account_number',
            header: 'Kontonr',
            accessor: 'account_number',
            sortable: true,
            searchable: true,
            className: 'font-medium',
          },
          {
            key: 'account_name',
            header: 'Kontonavn',
            accessor: 'account_name',
            sortable: true,
            searchable: true,
            className: 'font-medium',
          },
          {
            key: 'description',
            header: 'Beskrivelse',
            accessor: 'description',
            sortable: true,
            searchable: true,
          },
          {
            key: 'voucher_number',
            header: 'Bilag',
            accessor: 'voucher_number',
            sortable: true,
            searchable: true,
            format: (value: string | null) => value || '-',
          },
          {
            key: 'vat_code',
            header: 'MVA-kode',
            accessor: 'vat_code' as any,
            sortable: true,
            searchable: true,
            format: (value: string | null) => value || '-',
          },
          {
            key: 'vat_rate',
            header: 'MVA-sats',
            accessor: 'vat_rate' as any,
            sortable: true,
            align: 'right',
            format: (value: number | string | null) => (value !== null && value !== undefined && value !== '' ? `${value}%` : '-'),
          },
          {
            key: 'vat_base',
            header: 'MVA-grunnlag',
            accessor: 'vat_base' as any,
            sortable: true,
            align: 'right',
            format: (value: number | null) => formatCurrency(value ?? 0),
          },
          {
            key: 'vat_amount',
            header: 'MVA-beløp',
            accessor: 'vat_amount' as any,
            sortable: true,
            align: 'right',
            format: (value: number | null) => formatCurrency(value ?? 0),
          },
          debitCol,
          creditCol,
          amountCol,
        ];
    }

    // Map feltdefinisjoner til kolonner
    const baseColumns: DataTableColumn<GeneralLedgerTransaction>[] = [];

    const dateField = fieldDefinitions.find(f => f.field_key === 'transaction_date');
    const accountField = fieldDefinitions.find(f => f.field_key === 'account_number');
    const descriptionField = fieldDefinitions.find(f => f.field_key === 'description');
    const voucherField = fieldDefinitions.find(f => f.field_key === 'voucher_number');
    const vatCodeField = fieldDefinitions.find(f => f.field_key === 'vat_code');
    const vatRateField = fieldDefinitions.find(f => f.field_key === 'vat_rate');
    const vatBaseField = fieldDefinitions.find(f => f.field_key === 'vat_base');
    const vatAmountField = fieldDefinitions.find(f => f.field_key === 'vat_amount');

    if (dateField) {
      baseColumns.push({
        key: 'transaction_date',
        header: dateField.field_label,
        accessor: 'transaction_date',
        sortable: true,
        format: (value: string) => format(new Date(value), 'dd.MM.yyyy'),
      });
    }

    if (accountField) {
      baseColumns.push({
        key: 'account_number',
        header: 'Kontonr',
        accessor: 'account_number',
        sortable: true,
        searchable: true,
        className: 'font-medium',
      });
      baseColumns.push({
        key: 'account_name',
        header: 'Kontonavn',
        accessor: 'account_name',
        sortable: true,
        searchable: true,
        className: 'font-medium',
      });
    }

    if (descriptionField) {
      baseColumns.push({
        key: 'description',
        header: descriptionField.field_label,
        accessor: 'description',
        sortable: true,
        searchable: true,
      });
    }

    if (voucherField) {
      baseColumns.push({
        key: 'voucher_number',
        header: voucherField.field_label,
        accessor: 'voucher_number',
        sortable: true,
        searchable: true,
        format: (value: string | null) => value || '-',
      });
    }

    if (vatCodeField) {
      baseColumns.push({
        key: 'vat_code',
        header: vatCodeField.field_label,
        accessor: 'vat_code' as any,
        sortable: true,
        searchable: true,
        format: (value: string | null) => value || '-',
      });
    }

    if (vatRateField) {
      baseColumns.push({
        key: 'vat_rate',
        header: vatRateField.field_label,
        accessor: 'vat_rate' as any,
        sortable: true,
        align: 'right',
        format: (value: number | string | null) => (value !== null && value !== undefined && value !== '' ? `${value}%` : '-'),
      });
    }

    if (vatBaseField) {
      baseColumns.push({
        key: 'vat_base',
        header: vatBaseField.field_label,
        accessor: 'vat_base' as any,
        sortable: true,
        align: 'right',
        format: (value: number | null) => formatCurrency(value ?? 0),
      });
    }

    if (vatAmountField) {
      baseColumns.push({
        key: 'vat_amount',
        header: vatAmountField.field_label,
        accessor: 'vat_amount' as any,
        sortable: true,
        align: 'right',
        format: (value: number | null) => formatCurrency(value ?? 0),
      });
    }

    // Alltid inkluder Debet/Kredit og Beløp
    baseColumns.push(debitCol);
    baseColumns.push(creditCol);
    baseColumns.push(amountCol);

    return baseColumns;
  }, [fieldDefinitions]);

  // Filtrer etter valgt kolonnekonfig
  const visibleColumns: DataTableColumn<GeneralLedgerTransaction>[] = useMemo(() => {
    const visibleKeys = new Set(columnConfig.filter(c => c.visible).map(c => c.key));
    return (allColumns || []).filter(col => visibleKeys.has(col.key));
  }, [allColumns, columnConfig]);

  // Note: Totals are no longer calculated here as this component now uses denormalized data from useGeneralLedgerData
  // We keep this for compatibility, but in practice it just returns basic page totals
  const totals = useMemo(() => {
    if (!sortedTransactions) return null;

    const hasDebCred = sortedTransactions.some(t => t.debit_amount !== null || t.credit_amount !== null);

    const debit = hasDebCred
      ? sortedTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0)
      : sortedTransactions.reduce((sum, t) => sum + ((t.balance_amount || 0) > 0 ? (t.balance_amount as number) : 0), 0);

    const credit = hasDebCred
      ? sortedTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0)
      : sortedTransactions.reduce((sum, t) => sum + ((t.balance_amount || 0) < 0 ? Math.abs(t.balance_amount as number) : 0), 0);

    const balance = hasDebCred
      ? debit - credit
      : sortedTransactions.reduce((sum, t) => sum + (t.balance_amount || 0), 0);

    return { debit, credit, balance };
  }, [sortedTransactions]);

  const totalRow = totals ? (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={Math.max(1, (visibleColumns?.length || 1) - 1)}>Sum</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span>Debet: {formatCurrency(totals.debit)}</span>
          <span>Kredit: {formatCurrency(totals.credit)}</span>
          <span className={Math.abs(totals.balance) < 0.01 ? 'text-foreground' : 'text-destructive'}>
            Netto: {formatCurrency(totals.balance)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  ) : null;

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  
// Create description text
  const description = !isCountLoading ? 
    `Viser ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount || 0)} av ${totalCount || 0} transaksjoner${sortedTransactions && sortedTransactions.length > 0 ? ` • Side ${currentPage} av ${totalPages}` : ''}${accountNumberFilter ? ` • Filtrert på konto ${accountNumberFilter}` : ''}` :
    undefined;


  return (
    <>
      <div className="mb-2 flex items-center justify-end gap-2">
        <ColumnSelector columns={columnConfig} onColumnChange={handleColumnChange} />
      </div>
      <DataTable
        title="Hovedbok"
        description={description}
        icon={<LineChart className="h-5 w-5" />}
        data={sortedTransactions || []}
        columns={visibleColumns}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Søk i transaksjoner..."
        enableExport={true}
        exportFileName={`hovedbok_${new Date().getFullYear()}`}
        enablePagination={true}
        pageSize={pageSize}
        totalCount={totalCount || 0}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        showTotals={true}
        totalRow={totalRow}
        emptyMessage={
          activeVersion 
            ? `Ingen transaksjoner i aktiv versjon (${activeVersion.version_number}). Last opp data eller aktiver en annen versjon.`
            : "Ingen aktiv versjon funnet. Last opp hovedbok eller aktiver en eksisterende versjon."
        }
        enableColumnManager={false}
        enableServerSorting={true}
        onSort={handleSort}
        serverSortBy={sortBy}
        serverSortOrder={sortOrder}
      />
    </>
  );
};

export default GeneralLedgerTable;