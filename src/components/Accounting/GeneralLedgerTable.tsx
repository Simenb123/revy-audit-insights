import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { getFieldDefinitions } from '@/utils/fieldDefinitions';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
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
  
  // Use the updated useTransactions hook that provides server-side totals
  const { data: transactionData, isLoading, error } = useTransactions(clientId, {
    page: currentPage,
    pageSize,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  const transactions = transactionData?.transactions || [];
  const totalCount = transactionData?.count || 0;
  const serverTotals = transactionData?.totals || { totalDebit: 0, totalCredit: 0, totalBalance: 0 };
  const { data: activeVersion } = useActiveVersion(clientId);

  if (isDebug) {
    logger.log('📊 GeneralLedgerTable data:', {
      transactionsCount: transactions?.length || 0,
      totalCount,
      serverTotals,
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

  // Default column visibility for StandardDataTable
  const defaultColumnState = [
    { key: 'transaction_date', visible: true },
    { key: 'account_number', visible: true },
    { key: 'account_name', visible: true },
    { key: 'description', visible: true },
    { key: 'voucher_number', visible: true },
    { key: 'debit_amount', visible: true },
    { key: 'credit_amount', visible: true },
    { key: 'balance_amount', visible: true },
    { key: 'vat_code', visible: false },
    { key: 'vat_rate', visible: false },
    { key: 'vat_base', visible: false },
    { key: 'vat_amount', visible: false },
  ];

  const handleSort = React.useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  // Alle kolonner basert på felter
  const allColumns: StandardDataTableColumn<any>[] = useMemo(() => {
    const debitCol: StandardDataTableColumn<any> = {
      key: 'debit_amount',
      header: 'Debet',
      accessor: 'debit_amount',
      sortable: true,
      align: 'right',
      format: (value: number | null) => formatCurrency(value ?? 0),
    };

    const creditCol: StandardDataTableColumn<any> = {
      key: 'credit_amount',
      header: 'Kredit',
      accessor: 'credit_amount',
      sortable: true,
      align: 'right',
      format: (value: number | null) => formatCurrency(value ?? 0),
    };

    const amountCol: StandardDataTableColumn<any> = {
      key: 'balance_amount',
      header: 'Beløp',
      accessor: 'balance_amount',
      sortable: true,
      align: 'right',
      format: (value: number | null, row?: any) => {
        // Safeguard: compute net amount if missing
        const netAmount = value ?? ((row?.debit_amount ?? 0) - (row?.credit_amount ?? 0));
        const safeNetAmount = isNaN(netAmount) ? 0 : netAmount;
        
        return (
          <span className={safeNetAmount && safeNetAmount < 0 ? 'text-destructive' : ''}>
            {formatCurrency(safeNetAmount)}
          </span>
        );
      },
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
    const baseColumns: StandardDataTableColumn<any>[] = [];

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

  // All columns are now handled by StandardDataTable's internal column manager
  const columns = allColumns;

  // Use server-calculated totals from the edge function
  const totals = useMemo(() => {
    return {
      debit: serverTotals.totalDebit,
      credit: serverTotals.totalCredit,
      balance: serverTotals.totalBalance
    };
  }, [serverTotals]);

  const totalRow = (
    <TableRow className="font-bold border-t-2 bg-muted/50">
      <TableCell colSpan={Math.max(1, (columns?.length || 1) - 1)}>Sum</TableCell>
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
  );

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  
// Create description text
  const description = `Viser ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount || 0)} av ${totalCount || 0} transaksjoner${transactions && transactions.length > 0 ? ` • Side ${currentPage} av ${totalPages}` : ''}${accountNumberFilter ? ` • Filtrert på konto ${accountNumberFilter}` : ''}`;


  return (
    <StandardDataTable
      title="Hovedbok"
      description={description}
      icon={<LineChart className="h-5 w-5" />}
      data={transactions || []}
      columns={columns}
      isLoading={isLoading}
      error={error}
      searchPlaceholder="Søk i transaksjoner..."
      exportFileName={`hovedbok_${new Date().getFullYear()}`}
      enablePdfExport={true}
      pdfTitle="Hovedbok"
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
      enableServerSorting={true}
      onSort={handleSort}
      serverSortBy={sortBy}
      serverSortOrder={sortOrder}
      preferencesKey="general-ledger-table"
      defaultColumnState={defaultColumnState}
      tableName="Hovedbok"
    />
  );
};

export default GeneralLedgerTable;