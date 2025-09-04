import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { usePayrollRawData } from '@/hooks/usePayrollDetailedData';
import { extractEmployeeIncomeRows, A07Row } from '@/modules/payroll/lib/a07-parser';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PayrollEmployeesTabProps {
  importId: string;
}

export function PayrollEmployeesTab({ importId }: PayrollEmployeesTabProps) {
  const { data: rawData, isLoading } = usePayrollRawData(importId);

  const incomeRows = useMemo((): A07Row[] => {
    if (!rawData?.raw_json) return [];
    const result = extractEmployeeIncomeRows(rawData.raw_json);
    // extractEmployeeIncomeRows returns A07ParseResult, we need the rows
    return result.rows || [];
  }, [rawData]);

  const summary = useMemo(() => {
    const uniqueEmployees = new Set(incomeRows.map(row => row.ansattFnr)).size;
    const totalAmount = incomeRows.reduce((sum, row) => sum + row.beloep, 0);
    const uniqueIncomeTypes = new Set(incomeRows.map(row => row.beskrivelse)).size;
    
    return {
      uniqueEmployees,
      totalAmount,
      uniqueIncomeTypes,
      totalRows: incomeRows.length
    };
  }, [incomeRows]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Laster ansattdata...</p>
      </div>
    );
  }

  if (!rawData?.raw_json || incomeRows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen ansattdata funnet</p>
      </div>
    );
  }

  const columns: StandardDataTableColumn<A07Row>[] = [
    {
      key: 'orgnr',
      header: 'Orgnr',
      accessor: 'orgnr',
      sortable: true,
      searchable: true,
      format: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'ansattFnr',
      header: 'Ansatt FNR',
      accessor: 'ansattFnr',
      sortable: true,
      searchable: true,
      format: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'navn',
      header: 'Navn',
      accessor: 'navn',
      sortable: true,
      searchable: true,
      format: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'beskrivelse',
      header: 'Beskrivelse',
      accessor: 'beskrivelse',
      sortable: true,
      searchable: true,
      format: (value) => <span className="text-sm">{value}</span>
    },
    {
      key: 'fordel',
      header: 'Fordel',
      accessor: 'fordel',
      sortable: true,
      searchable: true,
      format: (value) => <span className="text-sm">{value}</span>
    },
    {
      key: 'beloep',
      header: 'Beløp',
      accessor: 'beloep',
      sortable: true,
      align: 'right',
      format: (value) => <span className="font-medium">{formatCurrency(value)}</span>
    },
    {
      key: 'antall',
      header: 'Antall',
      accessor: 'antall',
      sortable: true,
      align: 'center',
      format: (value) => value || '-'
    },
    {
      key: 'trekkpliktig',
      header: 'Trekkpliktig',
      accessor: 'trekkpliktig',
      align: 'center',
      format: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ja' : 'Nei'}
        </Badge>
      )
    },
    {
      key: 'aga',
      header: 'AGA',
      accessor: 'aga',
      align: 'center',
      format: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ja' : 'Nei'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">A07 Inntektsdetaljer</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Detaljert oversikt over alle inntektsposter per ansatt fra A07-rapporten
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Antall ansatte</h4>
          <p className="text-2xl font-bold">{summary.uniqueEmployees}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Totalt beløp</h4>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Inntektstyper</h4>
          <p className="text-2xl font-bold">{summary.uniqueIncomeTypes}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Totalt antall poster</h4>
          <p className="text-2xl font-bold">{summary.totalRows}</p>
        </Card>
      </div>

      <StandardDataTable
        title="A07 Inntektsposter"
        description="Alle inntektsposter per ansatt fra A07-rapporten"
        data={incomeRows}
        columns={columns}
        tableName="a07-income-details"
        exportFileName="a07-inntektsdetaljer"
        maxBodyHeight="600px"
      />
    </div>
  );
}