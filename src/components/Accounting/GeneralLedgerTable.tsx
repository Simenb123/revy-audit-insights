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
import ColumnSelector, { ColumnConfig } from '@/components/Accounting/ColumnSelector';
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

  // Kolonnevalg (gjenbruk fra Saldobalanse)
  const [columnConfig, setColumnConfig] = React.useState<ColumnConfig[]>([
    { key: 'transaction_date', label: 'Dato', visible: true, required: true },
    { key: 'account_info', label: 'Konto', visible: true, required: true },
    { key: 'description', label: 'Beskrivelse', visible: true },
    { key: 'voucher_number', label: 'Bilag', visible: true },
    { key: 'debit_amount', label: 'Debet', visible: true },
    { key: 'credit_amount', label: 'Kredit', visible: true },
    { key: 'balance_amount', label: 'Beløp', visible: true },
  ]);

  const handleColumnChange = React.useCallback((key: string, visible: boolean) => {
    setColumnConfig(prev => prev.map(c => (c.key === key ? { ...c, visible } : c)));
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

    // Map feltdefinisjoner til kolonner
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
    `Viser ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount || 0)} av ${totalCount || 0} transaksjoner${transactions && transactions.length > 0 ? ` • Side ${currentPage} av ${totalPages}` : ''}${accountNumberFilter ? ` • Filtrert på konto ${accountNumberFilter}` : ''}` :
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
        data={transactions || []}
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
        emptyMessage="Ingen transaksjoner funnet"
        enableColumnManager={false}
      />
    </>
  );
};

export default GeneralLedgerTable;