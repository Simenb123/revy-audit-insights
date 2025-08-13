import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { GeneralLedgerTransaction, useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useGeneralLedgerCount } from '@/hooks/useGeneralLedgerCount';
import { getFieldDefinitions } from '@/utils/fieldDefinitions';
import DataTable, { DataTableColumn } from '@/components/ui/data-table';
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
  const pageSize = 100;
  const isDebug = process.env.NODE_ENV !== 'production';

  if (isDebug) {
    logger.log('🔍 GeneralLedgerTable rendering for client:', clientId, 'version:', versionId);
  }
  
  const { data: transactions, isLoading, error } = useGeneralLedgerData(clientId, versionId, { page: currentPage, pageSize }, { accountNumber: accountNumberFilter });
  const { data: totalCount, isLoading: isCountLoading } = useGeneralLedgerCount(clientId, versionId, { accountNumber: accountNumberFilter });
  const { data: allTransactions, isLoading: isExportLoading } = useGeneralLedgerData(clientId, versionId, undefined, { accountNumber: accountNumberFilter });

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

  // Define columns based on field definitions
  const columns: DataTableColumn<GeneralLedgerTransaction>[] = useMemo(() => {
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
      // Fallback columns if field definitions are not loaded
      return [
        {
          key: 'transaction_date',
          header: 'Dato',
          accessor: 'transaction_date',
          sortable: true,
          format: (value: string) => format(new Date(value), 'dd.MM.yyyy'),
        },
        {
          key: 'account_info',
          header: 'Konto',
          accessor: (transaction: GeneralLedgerTransaction) => (
            <div>
              <div className="font-medium">{transaction.account_number}</div>
              <div className="text-sm text-muted-foreground">{transaction.account_name}</div>
            </div>
          ),
          sortable: true,
          searchable: true,
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
        debitCol,
        creditCol,
        amountCol,
      ];
    }

    // Map field definitions to columns
    const baseColumns: DataTableColumn<GeneralLedgerTransaction>[] = [];

    const dateField = fieldDefinitions.find(f => f.field_key === 'transaction_date');
    const accountField = fieldDefinitions.find(f => f.field_key === 'account_number');
    const descriptionField = fieldDefinitions.find(f => f.field_key === 'description');
    const voucherField = fieldDefinitions.find(f => f.field_key === 'voucher_number');

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
        key: 'account_info',
        header: accountField.field_label,
        accessor: (transaction: GeneralLedgerTransaction) => (
          <div>
            <div className="font-medium">{transaction.account_number}</div>
            <div className="text-sm text-muted-foreground">{transaction.account_name}</div>
          </div>
        ),
        sortable: true,
        searchable: true,
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

    // Always include Debet/Kredit and Beløp columns for richer GL view
    baseColumns.push(debitCol);
    baseColumns.push(creditCol);
    baseColumns.push(amountCol);

    return baseColumns;
  }, [fieldDefinitions]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!transactions) return null;

    const hasDebCred = transactions.some(t => t.debit_amount !== null || t.credit_amount !== null);

    const debit = hasDebCred
      ? transactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0)
      : transactions.reduce((sum, t) => sum + ((t.balance_amount || 0) > 0 ? (t.balance_amount as number) : 0), 0);

    const credit = hasDebCred
      ? transactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0)
      : transactions.reduce((sum, t) => sum + ((t.balance_amount || 0) < 0 ? Math.abs(t.balance_amount as number) : 0), 0);

    const balance = hasDebCred
      ? debit - credit
      : transactions.reduce((sum, t) => sum + (t.balance_amount || 0), 0);

    return { debit, credit, balance };
  }, [transactions]);

  // Create total row
  const totalRow = totals ? (
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
  ) : null;

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  
// Create description text
  const description = !isCountLoading ? 
    `Viser ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount || 0)} av ${totalCount || 0} transaksjoner${transactions && transactions.length > 0 ? ` • Side ${currentPage} av ${totalPages}` : ''}${accountNumberFilter ? ` • Filtrert på konto ${accountNumberFilter}` : ''}` :
    undefined;

  const defaultColumnState = useMemo(() => ([
    { key: 'transaction_date', visible: true, pinnedLeft: true },
    { key: 'account_info', visible: true, pinnedLeft: true },
    { key: 'description', visible: true },
    { key: 'voucher_number', visible: true },
    { key: 'debit_amount', visible: true },
    { key: 'credit_amount', visible: true },
    { key: 'balance_amount', visible: true },
  ]), []);

  return (
    <DataTable
      title="Hovedbok"
      description={description}
      icon={<LineChart className="h-5 w-5" />}
      data={transactions || []}
      columns={columns}
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
      emptyMessage="Ingen transaksjoner funnet"
      enableColumnManager={true}
      preferencesKey={`gl-table:${clientId}:${versionId || 'active'}`}
      defaultColumnState={defaultColumnState}
    />
  );
};

export default GeneralLedgerTable;